import os, sys

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

def cap_mostSpread(y_s, y_e):
    return "From {} to {}, differences between the countries of the world was wider than ever".format(y_s, y_e)

def cap_valueChange(y_s, y_e, gname, axes, pattern):
    cap = ""
    for axis in axes:
        how = pattern.upper() if pattern else "" ## by n unit_map[axis["id"]]
        cap += "{} in {} {} between {} and {}".format(axis["name"], gname, how, y_s, y_e)
    return cap

def generateCaption(gname, axes, reason, pattern, head_y, tail_y, year=False):
    print("generateCaption", gname, axes)
    if reason == "spr":
        caption = cap_mostSpread(head_y, tail_y)
    if reason == "var":
        caption = cap_valueChange(head_y, tail_y, gname, axes, pattern)
    return caption
