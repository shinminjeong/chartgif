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
    "population": "Population",
    "continent": "Continent",
    "confirmed": "Confirmed",
    "death": "Deaths",
    "numdays": "Num days since 100th case",
    "size": "Size",
    "log": "Log",
    "lin": "Lin",
}
label_map = {
    "income": {"desc": "wealth", "low": "poor", "high": "rich"},
    "fertility": {"desc": "family size", "low": "few", "high": "many"},
    "lifespan": {"desc": "health", "low": "sick", "high": "healthy"},
    "population": {"desc": "population", "low": "few", "high": "many"},
    "none": {"desc": "", "high": ""},
}
unit_map = {
    "income": "dollars",
    "fertility": "baby",
    "lifespan": "years",
    "population": "",
}


def summarizeGroup(info, countries):
    # print("--- summarizeGroup", countries)
    if len(countries) == 1:
        return countries[0]

    desc = ""
    sub_regions = [info[c]["sub"] for c in countries]
    region_counter = Counter(sub_regions)
    if len(region_counter) == 1:
        desc = region_counter.most_common(1)[0][0]
    else:
        for c in region_counter.most_common(3):
            if (c[1]/len(sub_regions) > 0.1):
                desc += "{}({}%); ".format(c[0], int(100*c[1]/len(sub_regions)))
    # print(desc)
    return desc

def cap_mostSpread(y_s, y_e, gname, axes, pattern):
    return "In {}, differences between the countries of the world was wider than ever.".format(y_s)

def cap_noChange(y_s, y_e, gname, axes, pattern):
    cap = ""
    for axis in axes:
        cap += "{} in {} STUCK between {} and {}.".format(axis["name"], gname, y_s, y_e)
    return cap

def cap_valueChange(y_s, y_e, gname, axes, pattern):
    cap = ""
    for axis in axes:
        how = pattern.upper() if pattern else "" ## by n unit_map[axis["id"]]
        cap += "{} in {} {} between {} and {}.".format(axis["name"], gname, how, y_s, y_e)
    return cap

def cap_userGenerated(y_s, y_e, gname, axes, pattern):
    cap = ""
    for axis in axes:
        cap += "{} in {}, Something happened between {} and {}.".format(axis["name"], gname, y_s, y_e)
    return cap

def cap_summary(y_s, y_e, gname, axes, pattern):
    return "Summary for outerbound."

caption_generator = {
    "spr": cap_mostSpread,
    "var": cap_valueChange,
    "noc": cap_noChange,
    "user": cap_userGenerated,
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
    return "The size of the bubbles shows the size of {}.".format(options[key]["name"])

def generateInitSeq(options, groups, values):
    print("generateInitSeq", groups, options)
    output = []

    # X and Y axes
    for a in ["X", "Y"]:
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


def generateCaption(gname, axes, reason, pattern, head_y, tail_y, year=False):
    # print("generateCaption", gname, axes)
    caption = caption_generator[reason](head_y, tail_y, gname, axes, pattern)
    return caption
