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

file_map = {
    "income": "app/static/data/income_per_person_gdppercapita_ppp_inflation_adjusted.csv",
    "lifeexp": "app/static/data/life_expectancy_years.csv",
    "fertility": "app/static/data/children_per_woman_total_fertility.csv",
    "population": "app/static/data/population_total.csv",
    "continent": "app/static/data/country_continent.csv"
}
name_map = {
    "income": "Income",
    "fertility": "Babies per woman",
    "lifeexp": "Life Expectancy",
    "population": "Population",
    "continent": "Continent",
    "log": "Log",
    "lin": "Lin",
}
options = {
    "x": {"id": "income", "name": "Income"},
    "y": {"id": "lifeexp", "name": "Life Expectancy"},
    "s": {"id": "population", "name": "Population"},
    "c": {"id": "continent", "name": "Continent"},
    "xScale": {"id": "log", "name": "Log"},
    "yScale": {"id": "lin", "name": "Lin"},
}

continent_group = {"Asia":1, "Europe":2, "North America":3, "South America":3, "Africa":4, "Oceania":1, "Antarctica":-1};
K = 5; # group 0 for the entire world

def main(request):
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
    kgroups = {k:{"index": i, "group": continent_group[df_c.iloc[i]["continent"]]} for i, k in enumerate(countries)}

    values = map.drop(columns='country').fillna(-1)
    values[["{}_s".format(y) for y in years]] = df_s[years].astype("float")
    # normalise values for display
    values[["{}_x".format(y) for y in years]] = scale_income(values[["{}_x".format(y) for y in years]])

    # calculate average velocity/acceleration
    avg_v = {}
    groups = [0, 1, 2, 3, 4]
    for group_index in groups:
        if group_index == 0:
            X = values.to_numpy()
        else:
            cset = [v["index"] for k, v in kgroups.items() if v["group"] == group_index] # X value
            X = values.iloc[cset, :].to_numpy()
        D, minD, maxD = avg_velocity(X, numYears)
        avg_v[group_index] = {}
        for i, a in enumerate(selectedAxis):
            avg_v[group_index][a] = [{"year":int(y), "value":v, "min": m1, "max": m2} for y, v, m1, m2 in zip(years, D.tolist()[i*numYears:(i+1)*numYears], minD.tolist()[i*numYears:(i+1)*numYears], maxD.tolist()[i*numYears:(i+1)*numYears])]
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
