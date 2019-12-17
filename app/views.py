from django.shortcuts import render, render_to_response
from django.http import HttpResponse, JsonResponse
from django.template import Context
from django.template.context_processors import csrf
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.conf import settings

import os, csv, json
import pandas as pd

file_income = "app/static/data/income_per_person_gdppercapita_ppp_inflation_adjusted.csv"
file_lifeexp = "app/static/data/life_expectancy_years.csv"
file_population = "app/static/data/population_total.csv"
file_continent = "app/static/data/country_continent.csv"

def main(request):
    years = [str(y) for y in range(1800, 2019)]
    df_income = pd.read_csv(file_income)[['country']+years]
    df_lifexp = pd.read_csv(file_lifeexp)[['country']+years]
    map = pd.merge(df_income, df_lifexp, on='country', how='outer')
    # print(map.head())
    countries = map['country'].tolist()
    # print("countries", len(countries))

    df_population = pd.read_csv(file_population)[['country']+years]
    df_population_2 = df_population.loc[df_population['country'].isin(countries)].reset_index()
    # print("df_population", len(df_population))
    # print(countries == df_population['country'].tolist())

    df_continent = pd.read_csv(file_continent)
    df_continent = df_continent.loc[df_continent['country'].isin(countries)].reset_index()
    # print("df_continent", len(df_continent))
    # print(countries == df_continent['country'].tolist())

    return render(request, "main.html", {
        "data": map.to_json(),
        "population": df_population_2.to_json(),
        "continent": df_continent.to_json(),
    })
