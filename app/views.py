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
        })
    else:
        K = int(request.GET.get("K"))
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
        kgroups = {k:{"index": i, "group": cluster[i][0]} for i, k in enumerate(countries)}

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
        })

# def distance(request):
#     K = int(request.GET.get("k"))
#     P = int(request.GET.get("p"))
#     print("k = ", K, ", p = ", P)
#
#     years = [str(y) for y in range(1800, 2019)]
#     df_income = pd.read_csv(file_income)[['country']+years]
#     df_lifexp = pd.read_csv(file_lifeexp)[['country']+years]
#     map = pd.merge(df_income, df_lifexp, on='country', how='inner').fillna(1)
#     countries = map['country'].tolist()
#
#     df_population = pd.read_csv(file_population)[['country']+years]
#     df_population_2 = df_population.loc[df_population['country'].isin(countries)].reset_index()
#
#     df_continent = pd.read_csv(file_continent)
#     df_continent = df_continent.loc[df_continent['country'].isin(countries)].reset_index()
#     # print(map.shape)
#
#     D = []
#     for i, c in enumerate(countries):
#         X = [[ map.loc[i][y+"_x"], map.loc[i][y+"_y"] ] for y in years]
#         # print(i, avg_distance(X, P))
#         print(i)
#         D.append(avg_distance(X, P))
#     # print(np.array(D).shape)
#     cluster, _, trans = cluster_Kmeans(np.array(D), K);
#     kgroups = {k:cluster[i][0] for i, k in enumerate(countries)}
#     # print(kgroups)
#
#     return render(request, "group.html", {
#         "data": map.to_json(),
#         "population": df_population_2.to_json(),
#         "continent": df_continent.to_json(),
#         "kgroup": kgroups,
#     })
