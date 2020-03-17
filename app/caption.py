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
    "recovered": "Recovered",
    "numdays": "Num days since 100th case",
    "size": "Size",
    "log": "Log",
    "lin": "Lin",
}
label_map = {
    "income": {"low": "poor", "high": "rich"},
    "fertility": {"low": "few", "high": "many"},
    "lifespan": {"low": "sick", "high": "healthy"},
    "confirmed": {"low": "few", "high": "many"},
    "recovered": {"low": "few", "high": "many"},
    "death": {"low": "few", "high": "many"},
    "numdays": {"low": "", "high": ""},
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

def cap_noChange(y_s, y_e, gname, axes):
    cap = ""
    for axis in axes:
        cap += "{} in {} STUCK between {} and {}".format(axis["name"], gname, y_s, y_e)
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

caption_generator = {
    "spr": cap_mostSpread,
    "var": cap_valueChange,
    "noc": cap_noChange,
    "user": cap_userGenerated
}

def generateCaption(gname, axes, reason, pattern, head_y, tail_y, year=False):
    # print("generateCaption", gname, axes)
    caption = caption_generator[reason](head_y, tail_y, gname, axes, pattern)
    return caption
