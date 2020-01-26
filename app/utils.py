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

def minmax_for_group(years, K, kgroups, selectedAxis, values):
    print(selectedAxis)
    minmax = {g:{y:{a:{"min": 0, "max": 0} for a in selectedAxis} for y in years} for g in range(0, K)}
    G = {g:[] for g in range(0, K)}
    for cname, cv in kgroups.items():
        G[cv["group"]].append(cv["index"])
    for y in years:
        for cgroup, cindex in G.items():
            for a in selectedAxis:
                minmax[cgroup][y][a]["min"] = min(values.loc[cindex][y+"_{}".format(a.lower())])
                minmax[cgroup][y][a]["max"] = max(values.loc[cindex][y+"_{}".format(a.lower())])
                if "X" == a:
                    minmax[cgroup][y][a]["min"] = descale_income(minmax[cgroup][y][a]["min"])
                    minmax[cgroup][y][a]["max"] = descale_income(minmax[cgroup][y][a]["max"])
    # print(minmax)
    return G, minmax

def scale_income(x):
    return np.log2(x)*10

def descale_income(y):
    return round(np.power(2, y/10))
