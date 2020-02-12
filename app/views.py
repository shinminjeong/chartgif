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
from sklearn.preprocessing import normalize
from .utils import *

file_income = "app/static/data/income_per_person_gdppercapita_ppp_inflation_adjusted.csv"
file_lifeexp = "app/static/data/life_expectancy_years.csv"
file_population = "app/static/data/population_total.csv"
file_continent = "app/static/data/country_continent.csv"


def main(request):
    selectedAxis = []

    years = [str(y) for y in range(1800, 2019)]
    df_income = pd.read_csv(file_income)[['country']+years].dropna()
    df_lifexp = pd.read_csv(file_lifeexp)[['country']+years].dropna()
    map = pd.merge(df_income, df_lifexp, on='country', how='inner')
    # print(map.head())
    countries = map['country'].tolist()
    # print("countries", len(countries))

    df_population = pd.read_csv(file_population)[['country']+years]
    df_population = df_population.loc[df_population['country'].isin(countries)].reset_index()
    df_continent = pd.read_csv(file_continent)
    df_continent = df_continent.loc[df_continent['country'].isin(countries)].reset_index()
    # print("df_population", df_population)
    # print("df_continent", len(df_continent))
    # print(countries == df_continent['country'].tolist())

    if "K" not in request.GET:
        return render(request, "group.html", {
            "data": map.to_json(),
            "population": df_population.to_json(),
            "continent": df_continent.to_json(),
            "selectedAxis": selectedAxis,
            "clusterinfo": [],
            "kgroup": [],
            "detail_on": False
        })
    else:
        K = int(request.GET.get("K"))
        detail_on = (request.GET.get("detail") == "on")
        print(request.GET)

        values = map.drop(columns='country').fillna(-1)
        # gap between each ticks
        # X-axis = 10 (10log2(income)) / Y-axis = 10 (life expectancy)
        values[["{}_x".format(y) for y in years]] = scale_income(values[["{}_x".format(y) for y in years]])

        cols = []
        if "X" in request.GET:
            selectedAxis.append("X")
            cols.extend(["{}_x".format(y) for y in years])
        if "Y" in request.GET:
            selectedAxis.append("Y")
            cols.extend(["{}_y".format(y) for y in years])
        if "S" in request.GET:
            selectedAxis.append("S")
            values[["{}_s".format(y) for y in years]] = df_population[years].astype("float")
            cols.extend(["{}_s".format(y) for y in years])
        if "D" in request.GET:
            selectedAxis.append("D")
            pass
        X = values[cols].to_numpy()
        n, m = X.shape
        # Normalize values by axis
        for r in range(0, m, len(years)):
            print(r, r+len(years))
            X[:, r:r+len(years)] = normalize(X[:, r:r+len(years)])

        cluster, _, trans = cluster_Kmeans(X, K);
        kgroups = {k:{"index": i, "group": cluster[i]} for i, k in enumerate(countries)}

        # calculate min/max for each group
        G, minmax = minmax_for_group(years, K, kgroups, selectedAxis, values)
        clusterinfo = {
            "K": K,
            "groups": range(0, K),
            "minmax": minmax
        }

        return render(request, "group.html", {
            "data": map.to_json(),
            "population": df_population.to_json(),
            "continent": df_continent.to_json(),
            "selectedAxis": selectedAxis,
            "clusterinfo": clusterinfo,
            "kgroup": kgroups,
            "detail_on": detail_on
        })


def slice(request):
    selectedAxis = []

    years = [str(y) for y in range(1800, 2019)]
    numYears = len(years)
    df_income = pd.read_csv(file_income)[['country']+years].dropna()
    df_lifexp = pd.read_csv(file_lifeexp)[['country']+years].dropna()
    map = pd.merge(df_income, df_lifexp, on='country', how='inner')
    # print(map.head())
    countries = map['country'].tolist()
    # print("countries", len(countries))

    df_population = pd.read_csv(file_population)[['country']+years]
    df_population = df_population.loc[df_population['country'].isin(countries)].reset_index()
    df_continent = pd.read_csv(file_continent)
    df_continent = df_continent.loc[df_continent['country'].isin(countries)].reset_index()
    # print("df_population", df_population)
    # print("df_continent", len(df_continent))
    # print(countries == df_continent['country'].tolist())

    if "W" not in request.GET:
        return render(request, "timeslice.html", {
            "data": map.to_json(),
            "population": df_population.to_json(),
            "continent": df_continent.to_json(),
            "selectedAxis": selectedAxis,
            "clusterinfo": [],
            "kgroup": [],
            "detail_on": False
        })
    else:
        W = int(request.GET.get("W"))
        detail_on = (request.GET.get("detail") == "on")
        print(request.GET)

        values = map.drop(columns='country').fillna(-1)
        # gap between each ticks
        # X-axis = 10 (10log2(income)) / Y-axis = 10 (life expectancy)
        values[["{}_x".format(y) for y in years]] = scale_income(values[["{}_x".format(y) for y in years]])

        cols = []
        if "X" in request.GET:
            selectedAxis.append("X")
            cols.extend(["{}_x".format(y) for y in years])
        if "Y" in request.GET:
            selectedAxis.append("Y")
            cols.extend(["{}_y".format(y) for y in years])
        if "S" in request.GET:
            selectedAxis.append("S")
            values[["{}_s".format(y) for y in years]] = df_population[years].astype("float")
            cols.extend(["{}_s".format(y) for y in years])
        if "D" in request.GET:
            selectedAxis.append("D")
            pass
        X = values[cols].to_numpy()
        n, m = X.shape
        print(n, m)

        pref = (numYears/W)
        # Normalize values by axis
        for r in range(0, m, numYears):
            print(r, r+numYears)
            X[:, r:r+numYears] = normalize(X[:, r:r+numYears])

        # separate time by time window size
        printgrp = {}
        kgroups = {}
        num_clusters = {}

        for frm in range(0, numYears, W):
            to = min(numYears, frm+W)
            print("Year: {} ~ {}".format(years[frm], years[to-1]))
            selectedCol = []
            for r in range(0, len(selectedAxis)):
                selectedCol.extend(list(range(frm+numYears*r, to+numYears*r)))
            # print(selectedCol)
            subX = X[:, selectedCol]
            # print(subX.shape)
            cluster, num_cluster, trans = cluster_AP(subX);
            printgrp[years[frm]] = {g: [] for g in range(num_cluster)}
            for i, k in enumerate(countries):
                printgrp[years[frm]][cluster[i]].append(k)

            for y in range(int(years[frm]), int(years[to-1])+1):
                num_clusters[str(y)] = num_cluster
                kgroups[str(y)] = {k:{"index": i, "group": cluster[i]} for i, k in enumerate(countries)}

            # print(cluster)
        # print(printgrp)

        # calculate min/max for each group
        G, minmax = minmax_for_group_slice(years, num_clusters, kgroups, selectedAxis, values)
        clusterinfo = {
            "W": W,
            "K": num_clusters,
            "minmax": minmax
        }

        return render(request, "timeslice.html", {
            "data": map.to_json(),
            "population": df_population.to_json(),
            "continent": df_continent.to_json(),
            "selectedAxis": selectedAxis,
            "clusterinfo": clusterinfo,
            "numYears": numYears,
            "kgroup": kgroups,
            "detail_on": detail_on,
            "printgrp": printgrp
        })
