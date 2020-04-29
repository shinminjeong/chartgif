import os, csv
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

color = [["#abc760","#60a561","#025b42"],
        ["#feca1f","#ff8800","#ef7674","#ca054d"],
        ["#05668d","#00aae3","#80ced7","#d4c1ec","#82204a"]]

video_length = 3*60+30 #3'30''
values = []

reader = csv.reader(open("comments.csv"), delimiter="|")
next(reader)
for rline in reader:
    for r in rline:
        if r == "-":
            continue
        s, e, cmt = r.split(";;")
        smin, ssec = s.split(":")
        emin, esec = e.split(":")
        stime = int(smin)*60 + int(ssec)
        etime = int(emin)*60 + int(esec)
        print(stime, etime)
        for t in range(stime, etime+1):
            values.append(t)
print(min(values), max(values))
plt.style.use('bmh')
plt.figure(figsize=[30,3])
plt.hist(values, bins = video_length)
plt.xlim(0, video_length)
plt.xlabel('Playback time (sec)',fontsize=16)
plt.ylabel('Num of comments',fontsize=16)
ax = plt.gca()
ax.xaxis.set_major_locator(ticker.MultipleLocator(30))
# plt.title('Comment Distribution',fontsize=12)
# plt.show()
plt.savefig("hist.png")
