import os, sys
from collections import Counter

# Life expectancy in {Region} increased/decreased by {change in value} years between {time} and {time}
# Income level in {Region} increased/decreased by {change in value} dollars between {time} and {time}
# Differences between the countries of the world was wider than ever
# outlier 표시
# -{Country} was way behind {Continent}
# -{Countries} were still poor and sick
# 일정 구간 trend 표시
# -{Countries/Continent} get healthier and healthier (or richer)
# Cluster 안에서 비슷한 나라 표시
# -{Country} has the same wealth and health as {another country}

name_map = {
    "income": "Income",
    "fertility": "Babies per woman",
    "lifespan": "Life Expectancy",
    "mortality": "Child Mortality",
    "population": "Population",
    "continent": "Continent",
    "confirmed": "Confirmed",
    "newcases": "New confirmed cases",
    "death": "Deaths",
    "recovered": "Recovered",
    "numdays": "Num days since 100th case",
    "size": "Size",
    "log": "Log",
    "lin": "Lin",
}
label_map = {
    "income": {"desc": "wealth", "low": "poor", "high": "rich"},
    "fertility": {"desc": "family size", "low": "few", "high": "many"},
    "mortality": {"desc": "child health", "low": "healthy", "high": "sick"},
    "lifespan": {"desc": "health", "low": "sick", "high": "healthy"},
    "population": {"desc": "population", "low": "few", "high": "many"},
    "confirmed": {"desc": "confirmed", "low": "few", "high": "many"},
    "newcases": {"desc": "new cases", "low": "few", "high": "many"},
    "recovered": {"desc": "recovered", "low": "few", "high": "many"},
    "death": {"desc": "deaths", "low": "few", "high": "many"},
    "numdays": {"desc": "", "low": "", "high": ""},
    "none": {"desc": "", "low": "", "high": ""},
}
unit_map = {
    "income": "dollars",
    "fertility": "baby",
    "lifespan": "years",
    "population": "",
}
desc = {
    "downup": "went down then up",
    "updown": "went up then down",
    "increased": "increased",
    "decreased": "decreased",
    "mostspread": "was most spread",
    "nochange": "does not change much",
    "user": "something happened"
}


def summarizeGroup(info, countries):
    # print("--- summarizeGroup", countries)
    if len(countries) == 1:
        return countries[0]

    desc = []
    sub_regions = [info[c]["sub"] for c in countries]
    region_counter = Counter(sub_regions)
    for c in region_counter.most_common(3):
        if (c[1]/len(sub_regions) > 0.05):
            desc.append(format(c[0]))
            # desc += "{}({}%); ".format(c[0], int(100*c[1]/len(sub_regions)))
    # print(desc)
    return ";".join(desc)

def cap_mostSpread(y_s, y_e, groups, g, axes, pattern, allgroup):
    return "In {}, the difference between the countries of the world was wider than ever.".format(y_s)

def cap_noChange(y_s, y_e, groups, g, axes, pattern, allgroup):
    cap = ""
    for axis in axes:
        cap += "{} in {} does not change much between {} and {}.".format(axis["name"], groups[g], y_s, y_e)
    return cap

def cap_valueChange(y_s, y_e, groups, g, axes, pattern, allgroup):
    cap = ""
    for axis in axes:
        how = desc[pattern] if pattern else "" ## by n unit_map[axis["id"]]
        cap += "{} in {} {} between {} and {}.".format(axis["name"], groups[g], how, y_s, y_e)
    return cap

def cap_userGenerated(y_s, y_e, groups, g, axes, pattern, allgroup):
    cap = ""
    for axis in axes:
        cap += "{} in {}, something happened between {} and {}.".format(axis["name"], groups[g], y_s, y_e)
    return cap

def cap_summary(y_s, y_e, groups, g, axes, pattern, allgroup):
    continents = [c for i, c in groups.items() if i > 0]
    cap = "From {} to {}, ".format(y_s, y_e)
    for axis, p in zip(axes, pattern):
        cap += "{} of {} {}.".format(axis["name"], " and ".join(continents), p)
    return cap

caption_generator = {
    "spr": cap_mostSpread,
    "var": cap_valueChange,
    "noc": cap_noChange,
    "usr": cap_userGenerated,
    "sum": cap_summary
}

def cap_axis(a, options):
    key = a.lower()
    return "An axis for {}, {}.".format(label_map[options[key]["id"]]["desc"], options[key]["name"])

def cap_trend(options, x_move, y_move):
    x_key = options["x"]["id"]
    y_key = options["y"]["id"]
    if x_move == y_move:
        return "Bottom left is {} and {}, upper right is {} and {}.".format(
            label_map[x_key]["low"], label_map[y_key]["low"],
            label_map[x_key]["high"], label_map[y_key]["high"])
    else:
        return "Upper left is {} and {}, bottom right is {} and {}.".format(
            label_map[x_key]["low"], label_map[y_key]["high"],
            label_map[x_key]["high"], label_map[y_key]["low"])

def cap_size(a, options):
    key = a.lower()
    return "The size of the bubbles shows the size of the {}.".format(options[key]["name"].lower())

def generateInitSeq(options, groups, values):
    print("generateInitSeq", groups, options)
    output = []

    # X and Y axes
    for a in ["Y", "X"]:
        output.append({ "reason": "init", "pattern": cap_axis(a, options), "g": 0, "a": [a], "years": ["init"] })
    # Overall trend
    x_move = (values["X"][-1]["value"]-values["X"][0]["value"])>0 # positive when going up otherwise negative
    y_move = (values["Y"][-1]["value"]-values["Y"][0]["value"])>0 # positive when going up otherwise negative
    output.append({ "reason": "init", "pattern": cap_trend(options, x_move, y_move), "g": 0, "a": ["Trend"], "years": ["init"] })
    # Introduce groups
    for k, v in groups.items():
        if k == 0: continue
        output.append({ "reason": "init", "pattern": "{}.".format(v), "g": k, "a": ["G"], "years": ["init"] })
    # Size
    output.append({ "reason": "init", "pattern": cap_size("S", options), "g": 0, "a": ["S"], "years": ["init"] })

    return output, x_move == y_move


def generateCaption(groups, g, axes, reason, pattern, head_y, tail_y, allgroup):
    # print("generateCaption", groups, g, axes, reason, pattern)
    caption = caption_generator[reason](head_y, tail_y, groups, g, axes, pattern, allgroup)
    return caption

def aggrNames(groups, nlist):
    if 0 in groups and groups[0] in nlist:
        return groups[0]
    if len(nlist) == 1:
        return nlist[0]
    return ", ".join(nlist[:-1])+" and "+nlist[-1]

def generatePrologue(groups, reasons, head_y, tail_y):
    # print("generatePrologue", groups, reasons, head_y, tail_y)
    reason_group = {}
    for r, v in reasons.items():
        pattern = v["pattern"][0]
        if pattern not in reason_group:
            reason_group[pattern] = []
        reason_group[pattern].append(r)

    caption = "From {} to {}, ".format(head_y, tail_y)
    for r, ids in reason_group.items():
        gnames = [groups[int(g.split("-")[-1])] for g in ids]
        caption += "{} {}. ".format(aggrNames(groups, gnames), desc[r])
    # print(caption)
    # print()
    return caption
