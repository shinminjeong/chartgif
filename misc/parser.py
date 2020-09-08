import os, csv
import drawSvg as draw

color = [["#abc760","#60a561","#025b42"],
        ["#feca1f","#ff8800","#ef7674","#ca054d"],
        ["#05668d","#00aae3","#80ced7","#d4c1ec","#82204a"]]
legends = ["Hand gestures", "Video editing", "Video playback"]
reasons = [["pointing","moving","shaping"],
        ["labeling","flickering","tracing","accumulating"],
        ["pause","slow down","move fast","go backward","instant replay"]]

def parseTimetable(filename):
    videos = {}
    reader = csv.reader(open(filename))
    next(reader)
    video = {}
    times = []
    order = -1
    for r in reader:
        if r[0]:
            if video:
                video["starttime"] = min(times)
                video["endtime"] = max(times)
                print(order, video["title"])
                if order < -1:
                    videos[order] = video
            video = {
                "title": "",
                "timeline": []
            }
            order = int(r[0])-1
            video["title"] = r[1]
            times = []

        s, e = r[2].split(":"), r[3].split(":")
        t1, t2, t3 = r[4], r[6], r[8]
        r1 = reasons[0].index(r[5]) if r[5].strip() else -1
        r2 = reasons[1].index(r[7]) if r[7].strip() else -1
        r3 = reasons[2].index(r[9]) if r[9].strip() else -1
        if len(s) == 3:
            s_sec = int(s[0])*3600+int(s[1])*60+int(s[2])
            e_sec = int(e[0])*3600+int(e[1])*60+int(e[2])
        else:
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
        print(order, video["title"])
        if order < -1:
            videos[order] = video
    return videos


videos = parseTimetable("timetable.csv")
# print(videos.keys())

# video_numbering = ["R1","R2","R3","R4","R5","R6","T1","T2","N1","W1","M1"]
video_numbering = ["R7","R8","R9","R10", "N2", "W2", "M2"]

h_pattern = 20
h_margin = h_pattern*3+30
top_margin = 80
left_margin = 815
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

for i, v in videos.items():
    print(i, v)
    i = -i-2
    texts = v["title"].split(";")
    d.append(draw.Text("[{}] {}".format(video_numbering[i], texts[0]), 24, left_margin-16, t_height-top_margin-h_margin*i-10-26*0, center=1, text_anchor="end", fill="black"))
    # if i==6:
    #     t = "{} (20'20''-23'42'')".format(texts[1])
    # elif i==7:
    #     t = "{} ({}'{}''-2'22'', 7'47''-{}'{}'')".format(texts[1], int(v["starttime"]/60), v["starttime"]%60, int(v["endtime"]/60), v["endtime"]%60)
    # else:
    t = "{} ({}'{}''-{}'{}'')".format(texts[1], int(v["starttime"]/60), v["starttime"]%60, int(v["endtime"]/60), v["endtime"]%60)
    d.append(draw.Text(t, 24, left_margin-16, t_height-top_margin-h_margin*i-10-26*1, center=1, text_anchor="end", fill="black"))

    # if i == 7: # for E8 -- merge two parts
    #     w100 = v["endtime"]-v["starttime"]-300
    # else:
    w100 = v["endtime"]-v["starttime"]
    d.append(draw.Rectangle(left_margin, t_height-top_margin-h_pattern*3-h_margin*i, t_width, h_pattern*3, fill="#eeeeee"))
    for frame in v["timeline"]:
        if i == 7: # for E8 -- merge two parts
            x = t_width*(frame["st"]-v["starttime"] if frame["st"]<300 else frame["st"]-300-v["starttime"])/w100
        else:
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
