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

file_income = "app/static/data/income_per_person_gdppercapita_ppp_inflation_adjusted.csv"
file_lifeexp = "app/static/data/life_expectancy_years.csv"
file_population = "app/static/data/population_total.csv"
file_continent = "app/static/data/country_continent.csv"

continent_group = {"Asia":0, "Europe":1, "North America":2, "South America":2, "Africa":3, "Oceania":0, "Antarctica":-1};
K = 4;

def main(request):
    selectedAxis = []

    years = [str(y) for y in range(1800, 2019)]
    numYears = len(years)
    df_income = pd.read_csv(file_income)[['country']+years].dropna()
    df_lifexp = pd.read_csv(file_lifeexp)[['country']+years].dropna()
    map = pd.merge(df_income, df_lifexp, on='country', how='inner')
    countries = map['country'].tolist()

    df_population = pd.read_csv(file_population)[['country']+years]
    df_population = df_population.loc[df_population['country'].isin(countries)].reset_index()
    df_continent = pd.read_csv(file_continent)
    df_continent = df_continent.loc[df_continent['country'].isin(countries)].reset_index()

    selectedAxis = ["X", "Y", "S"]
    kgroups = {k:{"index": i, "group": continent_group[df_continent.iloc[i]["continent"]]} for i, k in enumerate(countries)}

    values = map.drop(columns='country').fillna(-1)
    values[["{}_s".format(y) for y in years]] = df_population[years].astype("float")
    # normalise values for display
    values[["{}_x".format(y) for y in years]] = scale_income(values[["{}_x".format(y) for y in years]])

    # calculate average velocity/acceleration
    avg_v = {}
    groups = [0, 1, 2, 3]
    for group_index in groups:
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
        "population": df_population.to_json(),
        "continent": df_continent.to_json(),
        "selectedAxis": selectedAxis,
        "clusterinfo": clusterinfo,
        "kgroup": kgroups,
        "avg_velocity": avg_v,
        "focus_range": focus_range
    })
