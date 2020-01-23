import os, sys
import numpy as np
from sklearn import cluster, covariance, manifold
from sklearn.cluster import KMeans
from scipy.spatial.distance import euclidean

def avg_distance(X, p):
    d = [euclidean(X[i], X[i+p]) for i in range(0,len(X)-p, p)]
    return d

def cluster_Kmeans(X, num):
    kmeans = KMeans(n_clusters=num)
    trans = kmeans.fit_transform(X)
    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    dist = []
    for i in range(len(labels)):
        dist.append(trans[i][labels[i]])
    return list(zip(labels, dist)), num, trans

def minmax_for_group(years, K, kgroups, values):
    minmax = {g:{y:{"minx": 0, "maxx": 0, "miny": 0, "maxy": 0} for y in years} for g in range(0, K)}
    G = {g:[] for g in range(0, K)}
    for cname, cv in kgroups.items():
        G[cv["group"]].append(cv["index"])
    for y in years:
        for cgroup, cindex in G.items():
            minmax[cgroup][y]["minx"] = descale_income(min(values.loc[cindex][y+"_x"]))
            minmax[cgroup][y]["maxx"] = descale_income(max(values.loc[cindex][y+"_x"]))
            minmax[cgroup][y]["miny"] = min(values.loc[cindex][y+"_y"])
            minmax[cgroup][y]["maxy"] = max(values.loc[cindex][y+"_y"])
    # print(minmax)
    return G, minmax

def scale_income(x):
    return np.log2(x)*10

def descale_income(y):
    return round(np.power(2, y/10))
