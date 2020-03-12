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
    "lifespan": "app/static/data/life_expectancy_years.csv",
    "fertility": "app/static/data/children_per_woman_total_fertility.csv",
    "population": "app/static/data/population_total.csv",
    # "continent": "app/static/data/country_continent.csv",
    # "continent": "app/static/data/additional_data.csv",
    "confirmed": "app/static/data/covid-confirmed.csv",
    "death": "app/static/data/covid-death.csv",
    "numdays": "app/static/data/covid-numdays.csv",
    "continent": "app/static/data/covid-country.csv",
    "size": "app/static/data/covid-size.csv",
}

options = {
    "x": {"id": "numdays", "name": "Num Days since 100th case"},
    "y": {"id": "confirmed", "name": "Confirmed"},
    "s": {"id": "size", "name": "Population"},
    "c": {"id": "continent", "name": "Continent"},
    "xScale": {"id": "lin", "name": "Lin"},
    "yScale": {"id": "log", "name": "Log"},
}

# c_group = {"Asia":1, "Europe":2, "North America":3, "South America":3, "Africa":4, "Oceania":1, "Antarctica":-1}
# c_group_inv = {0: "the world", 1: "Asia", 2: "Europe", 3: "America", 4: "Africa"}
c_group = {"China":1, "Japan":2, "Hong Kong":3, "Singapore":4, "S Korea":5, "Iran":6, "France":7, "US":8, "Italy":9, "UK":10, "Spain":11}
c_group_inv = {0:"the world", 1:"China", 2:"Japan", 3:"Hong Kong", 4:"Singapore", 5: "S Korea", 6:"Iran", 7:"France", 8:"US", 9:"Italy", 10:"UK", 11:"Spain"}
K = 12 # group 0 for the entire world

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
        if v["id"] in label_map:
            options[k]["label"] = label_map[v["id"]]

    # print(options)
    selectedAxis = []

    years = [str(y) for y in range(1800, 1849)]
    # years = ["1/22/20","1/23/20","1/24/20","1/25/20","1/26/20","1/27/20","1/28/20","1/29/20","1/30/20","1/31/20"]
    # ,2/1/20,2/2/20,2/3/20,2/4/20,2/5/20,2/6/20,2/7/20,2/8/20,2/9/20,2/10/20,2/11/20,2/12/20,2/13/20,2/14/20,2/15/20,2/16/20,2/17/20,2/18/20,2/19/20,2/20/20,2/21/20,2/22/20,2/23/20,2/24/20,2/25/20,2/26/20,2/27/20,2/28/20,2/29/20,3/1/20,3/2/20,3/3/20,3/4/20,3/5/20,3/6/20,3/7/20,3/8/20,3/9/20,3/10/20,3/11/20]
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
    # kgroups = {k:{"index": i, "group": c_group[df_c.iloc[i]["continent"]], "sub": df_c.iloc[i]["sub_region"]} for i, k in enumerate(countries)}
    kgroups = {k:{"index": i, "group": c_group[df_c.iloc[i]["continent"]], "sub": ""} for i, k in enumerate(countries)}
    values = map.drop(columns='country').fillna(-1)
    values[["{}_s".format(y) for y in years]] = df_s[years].astype("float")

    print(values)
    # calculate average variance
    avg_v = {}
    groups = range(0, K)
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
    head_y = int(outerbound.get("head"))
    tail_y = int(outerbound.get("tail"))+1
    groups = {int(c):c_group_inv[int(c)] for c in outerbound.getlist("groups[]")}
    reasons = get_dict_from_request(dict(outerbound))
    print("get_caption", head_y, tail_y, groups, reasons)

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

    for id, v in reasons.items():
        # row: selected countries
        g = int(v["group"][0])
        cset = [v["index"] for k, v in kgroups.items() if g == 0 or v["group"] == g] # countries in selected continent

        # column: selected years of selected axis
        selectedCol = []
        axes = ["X", "Y", "S"]
        selectedAxis = list(v["axis"])
        yrange = [int(y) for y in v["yrange"]]
        for r in range(0, len(axes)): # selected years
            if axes[r] in selectedAxis:
                selectedCol.extend(list(range((yrange[0]-1800)+numYears*r, (yrange[-1]+1-1800)+numYears*r)))
        # print("---- group {} ---- {} ----".format(g, selectedAxis), selectedCol)

        ## cluster vector
        X = values.iloc[cset, selectedCol].to_numpy()
        # X = normalizeVector(X, tail_y-head_y)
        cluster, num_cluster, trans = cluster_MeanShift(X)

        printgrp[g] = {k:int(cluster[i]) for i, k in enumerate(cset)}
        groupdesc[g] = {c: [] for c in range(num_cluster)}
        for i, k in enumerate(cset):
            groupdesc[g][cluster[i]].append(k)
        for c, clist in groupdesc[g].items():
            groupdesc[g][c] = summarizeGroup(kgroups, [countries[vv] for vv in clist])

        axisNames = [options[a.lower()] for a in selectedAxis]
        caption[id] = generateCaption(groups[g], axisNames, v["reason"][0], v["pattern"][0], yrange[0], yrange[-1], g == 0)
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
