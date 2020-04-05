import os, csv
import drawSvg as draw

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
        s_sec = int(s[0])*60+int(s[1])
        e_sec = int(e[0])*60+int(e[1])
        times.append(s_sec)
        times.append(e_sec)
        video["timeline"].append({
            "st": s_sec,
            "et": e_sec,
            "pattern": [t1, t2, t3]
        })
    if video:
        video["starttime"] = min(times)
        video["endtime"] = max(times)
        videos.append(video)
    return videos


videos = parseTimetable("timetable.csv")
# print(videos)


color = ["#00D2CB", "#FFC702", "#83A3FF"]
legends = ["Hand gesture", "Video editing", "Video adjustment"]
h_pattern = 10
h_margin = h_pattern*3+20
left_margin = 170
right_margin = 10
bottom_margin = 40
t_width = 1000
t_height = bottom_margin+h_margin*(len(videos)-1)+h_pattern*3
d = draw.Drawing(left_margin+t_width+right_margin, t_height)
d.append(draw.Rectangle(0, 0, t_width+left_margin+right_margin, t_height, fill="white"))

for i, l in enumerate(legends):
    d.append(draw.Rectangle(5, t_height-i*25-20, 15, 15, fill=color[i]))
    d.append(draw.Text(l, 12, 25, t_height-i*25-16, center=0, fill="black"))


for i, v in enumerate(videos):
    print(v)
    d.append(draw.Text("[{}]".format(i+1), 14, left_margin-16, t_height-h_margin*i-8, center=0.6, fill="black"))
    w100 = v["endtime"]-v["starttime"]
    d.append(draw.Rectangle(left_margin, t_height-h_pattern*3-h_margin*i, t_width, h_pattern*3, fill="#eeeeee"))
    for frame in v["timeline"]:
        x = t_width*(frame["st"]-v["starttime"])/w100
        width = t_width*(frame["et"]-frame["st"])/w100
        for p, pattern in enumerate(frame["pattern"]):
            if (pattern == "Y"):
                # print(x, (p+1)*h_pattern+h_margin*i, h_margin*i)
                d.append(draw.Rectangle(left_margin+x, t_height-(p+1)*h_pattern-h_margin*i, width, h_pattern, fill=color[p]))
    # break

# time axis
axis_margin = 20
d.append(draw.Lines(
            left_margin, bottom_margin-axis_margin,
            left_margin+t_width, bottom_margin-axis_margin,
            close=False,
            stroke='black',
            stroke_width=1))
d.append(draw.Text("time", 10, left_margin+t_width-20, bottom_margin-axis_margin-8, center=0.6, fill="black"))
for x in [0, 0.25, 0.5, 0.75, 1]:
    p = x*t_width
    d.append(draw.Text("{}".format(x), 8, left_margin+p, bottom_margin-axis_margin+8, center=0.6, fill="black"))
    d.append(draw.Lines(
            left_margin+p, bottom_margin-axis_margin+4,
            left_margin+p, bottom_margin-axis_margin-4,
            close=False,
            stroke='black',
            stroke_width=1))

d.setPixelScale(2)  # Set number of pixels per geometry unit
#d.setRenderSize(400,200)  # Alternative to setPixelScale
# d.saveSvg('example.svg')
d.savePng('example.png')
