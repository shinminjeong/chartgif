import os, sys
import numpy as np
from sklearn import cluster, covariance, manifold
from sklearn.cluster import KMeans, AffinityPropagation, MeanShift
from scipy.spatial.distance import euclidean

def avg_velocity(X, len):
    n, m = X.shape
    X1 = np.roll(X, 1)
    X1[:, 0] = 0
    diff = X-X1
    avg_d = np.average(diff, axis=0)
    min_d = np.amin(diff, axis=0)
    max_d = np.amax(diff, axis=0)
    for i in range(0, m, len):
        avg_d[i] = min_d[i] = max_d[i] = 0
    return avg_d, min_d, max_d

def avg_accel(X, len):
    m = X.shape[0]
    X1 = np.roll(X, 1)
    X1[0] = 0
    avg_d = X-X1
    for i in range(0, m, len):
        avg_d[i] = 0
    return avg_d

def cluster_Kmeans(X, num):
    kmeans = KMeans(n_clusters=num, random_state=0)
    trans = kmeans.fit_transform(X)
    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    return labels, num, trans

def cluster_AP(X):
    af = AffinityPropagation(damping=0.97).fit(X)
    cluster_centers_indices = af.cluster_centers_indices_
    labels = af.labels_
    afmatrix = -af.affinity_matrix_
    centers = af.cluster_centers_
    n_clusters = len(cluster_centers_indices)
    print("AP] Estimated number of clusters: %d" % (n_clusters))
    return labels, n_clusters, afmatrix


def cluster_MeanShift(X):
    clustering = MeanShift().fit(X)
    labels = clustering.labels_
    cluster_centers = clustering.cluster_centers_
    labels_unique = np.unique(labels)
    n_clusters = len(labels_unique)
    print("MeanShift] Estimated number of clusters: %d" % (n_clusters))
    return labels, n_clusters, cluster_centers


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


def minmax_for_group_slice(years, K, kgroups, selectedAxis, values):
    print(selectedAxis)
    minmax = {y:{g:{a:{"min": 0, "max": 0} for a in selectedAxis} for g in range(0, K[y])} for y in years}
    G = {y:{g:[] for g in range(0, K[y])} for y in years}
    for y, value in kgroups.items():
        for cname, cv in value.items():
            G[y][cv["group"]].append(cv["index"])

    print(G.keys())
    print(minmax.keys())
    for y in years:
        for cgroup, cindex in G[y].items():
            for a in selectedAxis:
                minmax[y][cgroup][a]["min"] = min(values.loc[cindex][y+"_{}".format(a.lower())])
                minmax[y][cgroup][a]["max"] = max(values.loc[cindex][y+"_{}".format(a.lower())])
                if "X" == a:
                    minmax[y][cgroup][a]["min"] = descale_income(minmax[y][cgroup][a]["min"])
                    minmax[y][cgroup][a]["max"] = descale_income(minmax[y][cgroup][a]["max"])
    return G, minmax

def scale_income(x):
    return np.log2(x)*10

def descale_income(y):
    return round(np.power(2, y/10))
