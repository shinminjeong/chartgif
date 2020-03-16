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
from datetime import datetime
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
    "recovered": "app/static/data/covid-recovered.csv",
    "numdays": "app/static/data/covid-numdays.csv",
    "continent": "app/static/data/covid-country.csv",
    "size": "app/static/data/covid-size.csv",
    "timemap": "app/static/data/covid-timemap.csv",
}

options = {
    "x": {"id": "numdays", "name": "Num days since 100th case"},
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
# c_group = {"China":1, "Japan":2, "Hong Kong":2, "Singapore":2, "S Korea":2, "Iran":3, "France":3, "US":4, "Italy":3, "UK":3, "Spain":3}
# c_group_inv = {0:"World", 1:"China", 2:"Rest of Asia", 3:"Europe", 4:"America"}
K = len(c_group_inv)

values = None
kgroups = None
countries = None
timeseries = []
timemap = {}
numTicks = 0
def main(request):
    global values, kgroups, options, timemap, timeseries, numTicks, countries
    for k, v in options.items():
        if k in request.GET:
            id = request.GET.get(k)
            options[k] = {"id": id, "name": name_map[id]}
        if v["id"] in label_map:
            options[k]["label"] = label_map[v["id"]]

    # print(options)
    selectedAxis = []

    pd_x = pd.read_csv(file_map[options["x"]["id"]])
    pd_y = pd.read_csv(file_map[options["y"]["id"]])
    timeseries = [x for x,y in zip(pd_x.columns.tolist()[1:], pd_y.columns.tolist()[1:]) if x==y]

    reader = csv.reader(open(file_map["timemap"]))
    heads = next(reader)
    timemap = {k:r for k, r in zip(heads, next(reader))}
    print("timemap", timemap)

    numTicks = len(timeseries)
    df_x = pd_x[['country']+timeseries].dropna()
    df_y = pd_y[['country']+timeseries].dropna()
    map = pd.merge(df_x, df_y, on='country', how='inner')
    countries = map['country'].tolist()

    df_s = pd.read_csv(file_map[options["s"]["id"]])[['country']+timeseries]
    df_s = df_s.loc[df_s['country'].isin(countries)].reset_index()
    df_c = pd.read_csv(file_map[options["c"]["id"]])
    df_c = df_c.loc[df_c['country'].isin(countries)].reset_index()

    selectedAxis = ["X", "Y", "S"]
    # kgroups = {k:{"index": i, "group": c_group[df_c.iloc[i]["continent"]], "sub": df_c.iloc[i]["sub_region"]} for i, k in enumerate(countries)}
    kgroups = {k:{"index": i, "group": c_group[df_c.iloc[i]["continent"]], "sub": ""} for i, k in enumerate(countries)}
    values = map.drop(columns='country').fillna(-1)
    values[["{}_s".format(y) for y in timeseries]] = df_s[timeseries].astype("float")

    print(values)
    # calculate average variance
    avg_v = {}
    groups = list(c_group_inv.keys())
    for group_index in groups:
        if group_index == 0:
            X = values.to_numpy()
        else:
            cset = [v["index"] for k, v in kgroups.items() if v["group"] == group_index] # X value
            X = values.iloc[cset, :].to_numpy()
        D, minD, maxD = avg_value(X, numTicks)
        # D, minD, maxD = avg_variance(X, numTicks)
        avg_v[group_index] = {}
        for i, a in enumerate(selectedAxis):
            f = i*numTicks
            t = (i+1)*numTicks
            avg_v[group_index][a] = [{"time":y, "value":v, "min": m1, "max": m2, "diff": m2-m1} for y, v, m1, m2 in zip(timeseries, D.tolist()[f:t], minD.tolist()[f:t], maxD.tolist()[f:t])]
    # print(avg_v)
    focus_range = get_focus_range(timeseries, groups, selectedAxis, avg_v);

    G, minmax = minmax_for_group(timeseries, K, kgroups, selectedAxis, values)
    clusterinfo = {
        "K": K,
        "groups": range(0, K),
        "minmax": minmax
    }
    # print(kgroups)
    return render(request, "group.html", {
        "time_arr": timeseries,
        "timemap": timemap,
        "data": map.to_json(),
        "gname": c_group_inv,
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
    global values, kgroups, options, timemap, timeseries, numTicks, countries
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
        yrange = v["yrange"]
        ys = timeseries.index(yrange[0])
        ye = timeseries.index(yrange[-1])
        for r in range(0, len(axes)): # selected years
            if axes[r] in selectedAxis:
                selectedCol.extend(list(range(ys+numTicks*r, (ye+1)+numTicks*r)))
        # print("---- group {} ---- {} ----".format(g, selectedAxis), selectedCol)
        # print(values.iloc[cset, selectedCol])
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
        caption[id] = generateCaption(groups[g], axisNames, v["reason"][0], v["pattern"][0], timemap[yrange[0]], timemap[yrange[-1]], g == 0)
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
