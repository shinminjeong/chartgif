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
    "lifeexp": "Life Expectancy",
    "population": "Population",
    "continent": "Continent",
    "log": "Log",
    "lin": "Lin",
}
unit_map = {
    "income": "dollars",
    "fertility": "baby",
    "lifeexp": "years",
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

def cap_mostSpread(y_s, y_e):
    return "In {}, differences between the countries of the world was wider than ever".format(y_s)

def cap_valueChange(y_s, y_e, gname, axes, pattern):
    cap = ""
    for axis in axes:
        how = pattern.upper() if pattern else "" ## by n unit_map[axis["id"]]
        cap += "{} in {} {} between {} and {}".format(axis["name"], gname, how, y_s, y_e)
    return cap

def generateCaption(gname, axes, reason, pattern, head_y, tail_y, year=False):
    # print("generateCaption", gname, axes)
    if reason == "spr":
        caption = cap_mostSpread(head_y, tail_y)
    if reason == "var":
        caption = cap_valueChange(head_y, tail_y, gname, axes, pattern)
    return caption
