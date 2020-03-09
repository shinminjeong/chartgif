from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template import Context
from django.template.context_processors import csrf
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.conf import settings

import os, sys, csv, json
import pandas as pd
import numpy as np
from .utils import *
from .caption import *


file_map = {
    "income": "app/static/data/income_per_person_gdppercapita_ppp_inflation_adjusted.csv",
    "lifeexp": "app/static/data/life_expectancy_years.csv",
    "fertility": "app/static/data/children_per_woman_total_fertility.csv",
    "population": "app/static/data/population_total.csv",
    "continent": "app/static/data/country_continent.csv"
}

options = {
    "x": {"id": "income", "name": "Income"},
    "y": {"id": "lifeexp", "name": "Life Expectancy"},
    "s": {"id": "population", "name": "Population"},
    "c": {"id": "continent", "name": "Continent"},
    "xScale": {"id": "log", "name": "Log"},
    "yScale": {"id": "lin", "name": "Lin"},
}

c_group = {"Asia":1, "Europe":2, "North America":3, "South America":3, "Africa":4, "Oceania":1, "Antarctica":-1}
c_group_inv = {0: "the world", 1: "Asia", 2: "Europe", 3: "America", 4: "Africa"}
K = 5 # group 0 for the entire world

values = None
kgroups = None
numYears = 0
countries = None
def main(request):
    global values, kgroups, options, numYears, countries
    for k, v in options.items():
        if k in request.GET:
            id = request.GET.get(k)
            options[k] = {"id": id, "name": name_map[id]}
    # print(options)
    selectedAxis = []

    years = [str(y) for y in range(1800, 2019)]
    numYears = len(years)
    df_x = pd.read_csv(file_map[options["x"]["id"]])[['country']+years].dropna()
    df_y = pd.read_csv(file_map[options["y"]["id"]])[['country']+years].dropna()
    map = pd.merge(df_x, df_y, on='country', how='inner')
    countries = map['country'].tolist()

    df_s = pd.read_csv(file_map[options["s"]["id"]])[['country']+years]
    df_s = df_s.loc[df_s['country'].isin(countries)].reset_index()
    df_c = pd.read_csv(file_map[options["c"]["id"]])
    df_c = df_c.loc[df_c['country'].isin(countries)].reset_index()

    selectedAxis = ["X", "Y", "S"]
    kgroups = {k:{"index": i, "group": c_group[df_c.iloc[i]["continent"]]} for i, k in enumerate(countries)}

    values = map.drop(columns='country').fillna(-1)
    values[["{}_s".format(y) for y in years]] = df_s[years].astype("float")

    # calculate average variance
    avg_v = {}
    groups = [0, 1, 2, 3, 4]
    for group_index in groups:
        if group_index == 0:
            X = values.to_numpy()
        else:
            cset = [v["index"] for k, v in kgroups.items() if v["group"] == group_index] # X value
            X = values.iloc[cset, :].to_numpy()
        D, minD, maxD = avg_value(X, numYears)
        # D, minD, maxD = avg_variance(X, numYears)
        avg_v[group_index] = {}
        for i, a in enumerate(selectedAxis):
            f = i*numYears
            t = (i+1)*numYears
            avg_v[group_index][a] = [{"year":int(y), "value":v, "min": m1, "max": m2, "diff": m2-m1} for y, v, m1, m2 in zip(years, D.tolist()[f:t], minD.tolist()[f:t], maxD.tolist()[f:t])]
    # print(avg_v)
    focus_range = get_focus_range(groups, selectedAxis, avg_v);

    G, minmax = minmax_for_group(years, K, kgroups, selectedAxis, values)
    clusterinfo = {
        "K": K,
        "groups": range(0, K),
        "minmax": minmax
    }
    # print(kgroups)
    return render(request, "group.html", {
        "data": map.to_json(),
        "options": options,
        "population": df_s.to_json(),
        "continent": df_c.to_json(),
        "selectedAxis": selectedAxis,
        "clusterinfo": clusterinfo,
        "kgroup": kgroups,
        "avg_velocity": avg_v,
        "focus_range": focus_range
    })

@csrf_exempt
def get_caption(request):
    global values, kgroups, options, numYears, countries
    outerbound = request.POST
    print("get_caption", outerbound)

    head_y = int(outerbound.get("head"))
    tail_y = int(outerbound.get("tail"))
    groups = {int(c):c_group_inv[int(c)] for c in outerbound.getlist("groups[]")}
    reason = outerbound.get("reason")
    pattern = outerbound.get("pattern")
    axis_info = {g:set(outerbound.getlist("info[{}][]".format(g))) for g in groups}
    # print(groups)
    print(axis_info)
    continents = list(groups.values())
    if len(groups) > 2:
        regions = ", ".join(continents[:-1]) + " and " + continents[-1]
    elif len(groups) == 2:
        regions = " and ".join(continents)
    else:
        regions = continents[0]

    printgrp = {}
    groupdesc = {}
    caption = {}

    for g, gname in groups.items():
        # row: selected countries
        cset = [v["index"] for k, v in kgroups.items() if g == 0 or v["group"] == g] # countries in selected continent

        # column: selected years of selected axis
        selectedCol = []
        axes = ["X", "Y", "S"]
        selectedAxis = list(axis_info[g])
        for r in range(0, len(axes)): # selected years
            if axes[r] in selectedAxis:
                selectedCol.extend(list(range((head_y-1800)+numYears*r, (tail_y+1-1800)+numYears*r)))
        # print("---- group {} ---- {} ----".format(g, selectedAxis), selectedCol)

        ## cluster vector
        X = values.iloc[cset, selectedCol].to_numpy()
        # X = normalizeVector(X, tail_y-head_y)
        cluster, num_cluster, trans = cluster_MeanShift(X)

        printgrp[g] = {k:int(cluster[i]) for i, k in enumerate(cset)}
        groupdesc[g] = {c: [] for c in range(num_cluster)}
        for i, k in enumerate(cset):
            groupdesc[g][cluster[i]].append(k)
        for c, v in groupdesc[g].items():
            if len(v) == 1:
                groupdesc[g][c] = countries[v[0]]
            else:
                groupdesc[g][c] = " ".join([countries[vv] for vv in v])

        axisNames = [options[a.lower()] for a in selectedAxis]
        print("pattern", pattern)
        caption[g] = generateCaption(gname, axisNames, reason, pattern, head_y, tail_y, g == 0)
    # print(printgrp)
    # print(head_y, tail_y, "-----------------------------")
    # print(groupdesc)

    return JsonResponse({
        "head": head_y,
        "tail": tail_y,
        "innergrp": {
            "group": printgrp,
            "desc": groupdesc
        },
        "caption": caption
    })
