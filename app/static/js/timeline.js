class TimeLine {

  constructor(div_id, w, h) {
    this.margin = {top: 0, right: 35, bottom: 0, left:100, top_g: 25};
    this.width = w - this.margin.left - this.margin.right;
    this.height = h - this.margin.top - this.margin.bottom;
    this.div_id_background = div_id + "-background";
    this.div_id = div_id;

    this.slice_h = 30;
    this.caption_h = 20;

    this.frames = [];
  }

  initChart(timeframes, minYear, maxYear, gname) {
    this.framepanel = document.getElementById(this.div_id);
    this.bgpanel = document.getElementById(this.div_id_background);
    this.svg = d3.select("#"+this.div_id_background)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.chart_g = this.svg.append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.background = this.chart_g.append("rect")
      .attr("x", 0)
      .attr("y", this.margin.top_g)
      .attr("width", this.width)
      .attr("height", this.height-this.margin.top_g)
      .style("fill", "#d3d3d3");

    this.grid = this.chart_g.append("g");
    this.x_1 = this.grid.append("g");
    this.x_2 = this.grid.append("g");

    var framelines = [], hh = this.caption_h+this.slice_h;
    for (var l = hh; l < this.width; l += hh) {
      framelines.push(l);
    }
    this.grid.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(framelines)
    .enter().append("line")
      .attr("x1", 0)
      .attr("y1", d => d+this.margin.top_g)
      .attr("x2", this.width)
      .attr("y2", d => d+this.margin.top_g)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    for (var g = 0; g < legendCount; g++) {
      var legend_d = document.createElement("div");
      legend_d.className = "time-legend";
      legend_d.style.top = this.margin.top_g+(this.caption_h+this.slice_h)*g+15;
      legend_d.style.left = 0;
      legend_d.innerHTML = gname[g];
      this.framepanel.appendChild(legend_d);
    }

    this.updateXaxis(timeframes);
  }

  calculateTickValues(timeframes) {
    this.tickEveryYear = [];
    this.tickNumber = [minYear];
    for (var y in timeframes) {
      // console.log("updateXaxis", y, timeframes[+y], timeframes[+y+1])
      var l1 = +y-1 >= 0? timeframes[+y-1].length: 0;
      var l2 = timeframes[+y].length;
      var l3 = +y+1 < timeframes.length? timeframes[+y+1].length: 0;
      // console.log("**", timeframes[+y], l1, l2, l3)
      if (y == 0 || timeframes[+y]%20 == 0 || (l1 == l2 && l2 < l3) || (l2 == l3 && l2 < l1)) {
        if (timeframes[+y] - this.tickNumber[this.tickNumber.length-1] >= 3) {
          this.tickNumber.push(timeframes[+y]); // do not put numbers too close
        }
      }
      if (l2 == 4) this.tickEveryYear.push(timeframes[+y]);
    }
    this.tickNumber.push(maxYear);
  }

  updateXaxis(timeframes) {
    // console.log("updateXaxis", timeframes.length)
    this.calculateTickValues(timeframes);

    this.timeScale = d3.scaleBand()
      .domain(timeframes)
      .range([ 0, this.width ])
      .paddingInner(0)
      .paddingOuter(0);

    this.x_1.selectAll("*").remove();
    this.x_2.selectAll("*").remove();

    this.x_1
      .attr("transform", "translate(0," + this.margin.top_g + ")")
      .attr('class', 'timeline-x-axis')
      .call(d3.axisTop(this.timeScale)
        .tickFormat(d3.format("d"))
        .tickValues(this.tickNumber)
      );
    this.x_2
      .attr("class", "grid")
      .call(d3.axisBottom(this.timeScale)
        .tickSize(this.height)
        .tickValues(this.tickEveryYear)
        .tickFormat("")
      );

    // move time slices according to the new x-axis
    for (var i = 0; i < this.frames.length; i++) {
      var f = this.frames[i];
      var y_start = f.getAttribute("data-s-year"),
          y_end = f.getAttribute("data-e-year");
      var s = this.timeScale(y_start),
          e = this.timeScale(y_end);
      var newleft = this.margin.left+s+this.timeScale.bandwidth()/2,
          newwidth = e-s;
      f.style.left = newleft;
      f.style.width = newwidth;
      var orderbtn = $("div#"+f.id+".time-slice-order")[0];
      if (orderbtn != undefined) orderbtn.style.left = newwidth;

      if (f.className == "time-caption") {
        f.setAttribute("data-o-width", e-s);
        f.setAttribute("data-o-height", this.caption_h);
      }
    }
  }

  addFrame(yrange, gindex, name, reason, pattern, delay) {
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = this.timeScale(y_start),
        e = this.timeScale(y_end);
    // console.log("addFrame", gindex, y_start, y_end, s, e, delay);

    var tframe = document.createElement("div");
    tframe.className = "time-slice"
    tframe.id = [y_start, y_end, gindex].join("-");
    tframe.setAttribute("data-s-year", y_start);
    tframe.setAttribute("data-e-year", y_end);

    var top = this.margin.top_g+this.caption_h+(this.slice_h+this.caption_h)*(gindex),
        left = this.margin.left+s+this.timeScale.bandwidth()/2;
    tframe.style.top = top;
    tframe.style.left = left;
    tframe.style.width = e-s;
    tframe.style.height = this.slice_h;
    tframe.style.backgroundColor = gcolor(gindex);
    tframe.innerHTML = name + " " + pattern;

    if (gindex > 0) {
      var orderbtn = document.createElement("div");
      orderbtn.className = "time-slice-order"
      orderbtn.id = tframe.id;
      orderbtn.style.top = 14;
      orderbtn.style.left = e-s;
      var order = document.createElement("label");
      order.innerHTML = gindex;
      orderbtn.appendChild(order);
      var downbtn = document.createElement("a");
      downbtn.className = "down";
      downbtn.role = "button"
      downbtn.addEventListener("click", function(e) { changeFrameOrder("down", orderbtn.id) });
      var upbtn = document.createElement("a");
      upbtn.className = "up";
      upbtn.role = "button"
      upbtn.addEventListener("click", function(e) { changeFrameOrder("up", orderbtn.id) });
      orderbtn.appendChild(downbtn);
      orderbtn.appendChild(upbtn);

      orderbtn.addEventListener("mouseenter", function(e) {
        var btns = orderbtn.getElementsByTagName("A");
        btns[0].style.visibility = "visible";
        btns[1].style.visibility = "visible";
      });
      orderbtn.addEventListener("mouseleave", function(e) {
        var btns = orderbtn.getElementsByTagName("A");
        btns[0].style.visibility = "hidden";
        btns[1].style.visibility = "hidden";
      });
      tframe.appendChild(orderbtn);
    }

    tframe.addEventListener("mouseenter", showOptions);
    tframe.addEventListener("mouseleave", hideOptions);
    this.frames.push(tframe);
    this.framepanel.appendChild(tframe);
  }

  clearOuterBound() {
    $("div.time-slice-outer").remove();
  }

  addOuterBound(yrange) {
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = this.timeScale(y_start),
        e = this.timeScale(1+parseInt(y_end));
    var tframe = document.createElement("div");
    tframe.className = "time-slice-outer"
    tframe.style.top = 0;
    tframe.style.left = this.margin.left+s+this.timeScale.bandwidth()/2;
    tframe.style.width = e-s;
    tframe.style.height = this.height;
    this.bgpanel.appendChild(tframe);
  }

  addCaption(gid, caption) {
    // console.log("addCaption", gid, caption)
    var names = gid.split("-");
    var y_start = names[0],
        y_end = names[1],
        gindex = names[2];
    var s = this.timeScale(y_start),
        e = this.timeScale(y_end);
    var tframe = document.createElement("textarea");
    tframe.className = "time-caption"
    tframe.id = gid;
    tframe.style.top = this.margin.top_g+(this.slice_h+this.caption_h)*(+gindex);
    tframe.style.left = this.margin.left+s+this.timeScale.bandwidth()/2;
    tframe.style.width = e-s;
    tframe.style.height = this.caption_h;
    tframe.value = caption;

    tframe.setAttribute("data-s-year", y_start);
    tframe.setAttribute("data-e-year", y_end);
    tframe.setAttribute("data-o-width", e-s);
    tframe.setAttribute("data-o-height", this.caption_h);
    tframe.addEventListener("mouseover", function(e) {
      e.target.style.overflowX = "visible";
      e.target.style.whiteSpace = "normal";
      e.target.style.width = Math.max(150, e.target.getAttribute("data-o-width"));
      e.target.style.height = "auto";
      e.target.style.zIndex = 10;
      e.target.style.backgroundColor = "#007bff";
    });
    tframe.addEventListener("mouseout", function(e) {
      e.target.style.overflowX = "hidden";
      e.target.style.whiteSpace = "nowrap";
      e.target.style.width = e.target.getAttribute("data-o-width");
      e.target.style.height = e.target.getAttribute("data-o-height");
      e.target.style.zIndex = 8;
      e.target.style.backgroundColor = "#002654";
    });
    tframe.addEventListener("change", function(e) {
      // console.log("caption changed", e.target, e.target.value);
      updateCaption(e.target.id, e.target.value);
    })

    this.frames.push(tframe);
    this.framepanel.appendChild(tframe);
  }
}

function changeFrameOrder(direction, id) {
  console.log("changeFrameOrder", direction, id);

}

function removeTimeSlice(e) {
  var id = e.target.parentElement.id;
  // console.log("removebutton clicked", id)
  $("div#"+id+".time-slice").remove();
  $("textarea#"+id+".time-caption").remove();
  removeFrame(id);
}

function showOptions(e) {
  var target;
  if (e.target.className == "time-slice") target = e.target;
  else if (e.target.className == "time-slice-order") target = e.target.parentNode;
  else return;
  // console.log("showOption", target, target.style.width);

  target.style.opacity = 1;
  var removebtn = document.createElement("div");
  removebtn.className = "time-slice-remove"
  removebtn.id = target.id;
  removebtn.style.left = parseFloat(target.style.width.replace('px',''))-2;
  removebtn.innerHTML = "<i class='fa fa-times'></i>"
  removebtn.addEventListener("click", removeTimeSlice);
  target.appendChild(removebtn);
}

function hideOptions(e) {
  e.target.style.opacity = 0.6;
  // console.log("div#"+e.target.id+".time-slice-remove");
  $("div#"+e.target.id+".time-slice-remove").remove();
}
