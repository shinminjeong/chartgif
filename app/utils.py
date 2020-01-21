import os
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
