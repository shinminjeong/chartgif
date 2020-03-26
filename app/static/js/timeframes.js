class TimeFrames {
  constructor(timeseries, gname) {
    this.timeseries = timeseries;
    this.gname = gname;
    this.playtime = 0; // times timeunit is the playtime
    this.framearr = []; // order of outerbound
    this.framemap = {}; // info of inner frames for each outerbound
    this.yearmap = {};
    for (var t = 0; t < timeseries.length; t++) {
      var y = this.timeseries[t];
      this.yearmap[y] = {
        "group":[],
        "delay":1,
        "reason":{}
      };
    }
    this.default_slowdown = {
      "noc": 2,
      "var": 15,
      "spr": 20,
      "user": 10,
    };
  }

  calculateOuterbound() {
    this.outerbound = {};
    var head_y = -1, tail_y = -1;
    var groups = [], reasons = {};
    for (var y in this.yearmap) {
      if (this.yearmap[y]["group"].length > 0) {
        // console.log("-", y, head_y, tail_y)
        groups = groups.concat(this.yearmap[y]["group"]);
        for (var r in this.yearmap[y]["reason"]) {
          var rr = this.yearmap[y]["reason"][r];
          var id = [rr["yrange"][0],rr["yrange"][rr["yrange"].length-1],rr["group"]].join("-");
          reasons[id] = rr;
        }
        if (head_y != -1) {
          tail_y = y;
        } else {
          head_y = tail_y = y;
        }
      } else {
        if (head_y != -1) {
          // console.log("add", head_y, tail_y)
          var end_t = this.timeseries[this.timeseries.indexOf(tail_y)+1];
          var bound = {
            "start_time": head_y,
            "end_time": end_t,
            "groups": Array.from(new Set(groups)).sort(),
            "reason": reasons
          }
          this.outerbound[head_y] = bound;
        }
        head_y = tail_y = -1;
        groups = [];
        reasons = {};
      }
    }
  }

  getFrameOrder() {
    var order = [];
    var idx = 0;
    var runningtime = 0;
    for (var i=0; i<this.framearr.length; i++) {
      var r = this.framearr[i];
      var outerbound = r[0]=="init"?this.framemap["init"]:this.outerbound[r[0]];
      if (outerbound == undefined) {
        var s_t = this.timeseries.indexOf(r[0]),
            e_t = this.timeseries.indexOf(r[1]);
        console.log(r, s_t, e_t)
        runningtime += (e_t-s_t);
        continue;
      }

      outerbound.head = runningtime;
      for (var b in outerbound.reason) {
        this.framemap[b].head = runningtime;
        this.framemap[b].tail = runningtime + this.framemap[b].runningtime;
        runningtime += this.framemap[b].runningtime;
      }
      outerbound.tail = runningtime;
      order.push({
        "order": idx++,
        "id": r[0],
        "outerbound": outerbound
      });
    }
    return order;
  }

  getFrameMap() {
    return this.framemap;
  }

  getTimeFrames() {
    var timeFrames = [];
    var last_idx = 0;
    this.framearr = [["init", "init"]];
    for (var i=0; i < this.framemap["init"].runningtime; i++) {
      timeFrames.push(i);
    }
    for (var o in this.outerbound){
      var outerb = this.outerbound[o];

      // add blank frame
      var cur_s = this.timeseries.indexOf(outerb.start_time);
      if (cur_s-last_idx > 1) {
        this.framearr.push([this.timeseries[last_idx+1], this.timeseries[cur_s-1]]);
        var s = timeFrames.length;
        for (var i=s; i < s+(cur_s-last_idx-1); i++) {
          timeFrames.push(i);
        }
      }

      this.framearr.push([outerb.start_time, outerb.end_time]);
      for (var r in outerb.reason) {
        var s = timeFrames.length;
        for (var i=s; i < s+this.framemap[r].runningtime; i++) {
          timeFrames.push(i);
        }
      }
      last_idx = this.timeseries.indexOf(outerb.end_time);
    }
    // add last blank frame
    this.framearr.push([this.timeseries[last_idx+1], this.timeseries[this.timeseries.length-1]]);
    var s = timeFrames.length;
    for (var i=s; i < s+(this.timeseries.length-last_idx-1); i++) {
      timeFrames.push(i);
    }
    timeFrames.push(timeFrames.length);
    return timeFrames;
  }

  generateCaptions() {
    for (var v in this.outerbound) {
      getCaption(this.outerbound[v]);
    }
  }

  updateCaption(id, value) {
    var ids = id.split("-");
    // console.log("updateCaption", ids, parseInt(id[2]))
    for (var y = this.timeseries.indexOf(ids[0]); y <= this.timeseries.indexOf(ids[1]); y++) {
      var year = this.timeseries[y];
      caption[year][ids[2]] = value;
    }
  }

  addInitSeq(group, axis, reason, caption) {
    var initdelay = {"X": 10, "Y": 10, "S": 10, "G": 10, "Trend": 20};
    if (this.framemap["init"] == undefined) {
      this.framemap["init"] = {
        "head": 0,
        "tail": 0,
        "start_time": "Init",
        "caption": "Init",
        "reason": {},
        "runningtime": 0,
      }
    }
    var id = ["init", axis[0], group].join("-");
    var frame = {
      "head": 0,
      "tail": 0,
      "caption": caption,
      "name": axis[0],
      "group": group,
      "runningtime": initdelay[axis[0]],
    }
    this.framemap[id] = frame;
    this.framemap.init.runningtime += initdelay[axis[0]];
    this.framemap.init.reason[id] = frame;
  }

  addFrames(data_focus_range) {
    for (var i in data_focus_range) {
      var d = data_focus_range[i];
      this.addFrame(d.years, d.g, d.a, d.reason, d.pattern);
    }
  }

  addFrame(range, group, axis, reason, pattern) {
    if (range.length == 1 && range[0] == "init") {
      return this.addInitSeq(group, axis, reason, pattern);
    }

    var s_time = ""+range[0], e_time = ""+range[range.length-1];
    var id = [s_time, e_time, group].join("-");
    var names = [];
    for (var i in axis) {
      names.push(data_options[axis[i].toLowerCase()]["id"])
    }
    // console.log("addFrame", s_time, e_time, id, names, group, reason);
    for (var i = this.timeseries.indexOf(s_time); i < this.timeseries.indexOf(e_time); i++) {
      var t = this.timeseries[i];
      this.yearmap[t]["group"].push(+group)
      if (reason != "sum") this.yearmap[t]["delay"] = this.default_slowdown[reason];
      this.yearmap[t]["reason"][id] = {
        "yrange": range,
        "group": group,
        "axis": axis,
        "reason": reason,
        "pattern": pattern,
      }
    }
    this.framemap[id] = {
      "start_time": range[0],
      "end_time": range[range.length-1],
      "group": group,
      "head": 0,
      "tail": 0,
      "axis": axis,
      "name": names,
      "reason": reason,
      "pattern": pattern,
      "inner": [],
      "runningtime": range.length*this.default_slowdown[reason],
    }

    this.calculateOuterbound();
  }

}
