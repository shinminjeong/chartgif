import os, csv
import drawSvg as draw

color = [["#00D2CB","#009E98","#006966"],
        ["#FFC702","#BF9502","#806401"],
        ["#83C1FF","#6291BF","#52799F","#314860","#101820"]]
legends = ["Hand gestures", "Video editing", "Video playback"]
reasons = [["pointing","moving","shaping"],
        ["labeling","tracing","flickering"],
        ["pause","slow down","move fast","go backward","instant replay"]]

def parseTimetable(filename):
    videos = []
    reader = csv.reader(open(filename))
    next(reader)
    video = {}
    times = []
    for r in reader:
        if r[0]:
            if video:
                video["starttime"] = min(times)
                video["endtime"] = max(times)
                videos.append(video)
            video = {
                "title": "",
                "timeline": []
            }
            video["title"] = r[0]
            times = []

        s, e = r[1].split(":"), r[2].split(":")
        t1, t2, t3 = r[3], r[5], r[7]
        r1 = reasons[0].index(r[4]) if r[4].strip() else -1
        r2 = reasons[1].index(r[6]) if r[6].strip() else -1
        r3 = reasons[2].index(r[8]) if r[8].strip() else -1
        s_sec = int(s[0])*60+int(s[1])
        e_sec = int(e[0])*60+int(e[1])
        times.append(s_sec)
        times.append(e_sec)
        video["timeline"].append({
            "st": s_sec,
            "et": e_sec,
            "pattern": [t1, t2, t3],
            "reason": [r1, r2, r3]
        })
    if video:
        video["starttime"] = min(times)
        video["endtime"] = max(times)
        videos.append(video)
    return videos


videos = parseTimetable("timetable.csv")
# print(videos)

h_pattern = 20
h_margin = h_pattern*3+40
top_margin = 80
left_margin = 700
right_margin = 20
bottom_margin = 80
t_width = 2000
t_height = top_margin+bottom_margin+h_margin*(len(videos)-1)+h_pattern*3
d = draw.Drawing(left_margin+t_width+right_margin, top_margin+t_height)
d.append(draw.Rectangle(0, 0, t_width+left_margin+right_margin, t_height, fill="white"))

for i, l in enumerate(legends):
    for j, c in enumerate(color[i]):
        d.append(draw.Rectangle(left_margin+480+400*i+j*30, t_height-top_margin+40, 30, 30, fill=c))
    d.append(draw.Text(l, 24, left_margin+480+400*i+18+len(color[i])*30, t_height-top_margin+48, center=0, fill="black"))

for i, v in enumerate(videos):
    print(v)
    for j, text in enumerate(v["title"].split(";")):
        d.append(draw.Text(text, 24, left_margin-16, t_height-top_margin-h_margin*i-10-26*j, center=1, text_anchor="end", fill="black"))
    w100 = v["endtime"]-v["starttime"]
    d.append(draw.Rectangle(left_margin, t_height-top_margin-h_pattern*3-h_margin*i, t_width, h_pattern*3, fill="#eeeeee"))
    for frame in v["timeline"]:
        x = t_width*(frame["st"]-v["starttime"])/w100
        width = t_width*(frame["et"]-frame["st"])/w100
        for p, pattern in enumerate(zip(frame["pattern"],frame["reason"])):
            if (pattern[0] == "Y"):
                # print(x, (p+1)*h_pattern+h_margin*i, h_margin*i)
                d.append(draw.Rectangle(left_margin+x, t_height-top_margin-(p+1)*h_pattern-h_margin*i, width, h_pattern, fill=color[p][pattern[1]]))
    # break

# time axis
axis_margin = 40
d.append(draw.Lines(
            left_margin, bottom_margin-axis_margin,
            left_margin+t_width, bottom_margin-axis_margin,
            close=False,
            stroke='black',
            stroke_width=1))
d.append(draw.Text("time", 20, left_margin+t_width-40, bottom_margin-axis_margin-16, center=0.6, fill="black"))
for x in [0, 0.25, 0.5, 0.75, 1]:
    p = x*t_width
    d.append(draw.Text("{}".format(x), 16, left_margin+p, bottom_margin-axis_margin+16, center=0.6, fill="black"))
    d.append(draw.Lines(
            left_margin+p, bottom_margin-axis_margin+8,
            left_margin+p, bottom_margin-axis_margin-8,
            close=False,
            stroke='black',
            stroke_width=1))

d.setPixelScale(2)  # Set number of pixels per geometry unit
#d.setRenderSize(400,200)  # Alternative to setPixelScale
# d.saveSvg('example.svg')
d.savePng('example.png')
