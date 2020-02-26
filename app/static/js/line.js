var line_xscale;
var overlay_offset = 4;
class LineChart {

  constructor(div_id, w, h) {
    this.margin = {top: 10, right: 30, bottom: 20, left:0};
    this.width = w - this.margin.left - this.margin.right;
    this.height = h - this.margin.top - this.margin.bottom;
    this.div_id = div_id;
    // console.log("lineChart", this.div_id, this.width, this.height);
  }

  drawChart(data) {
    // console.log(data);
    var svg = d3.select("#"+this.div_id)
      .append('svg')
      .attr('width', this.width+this.margin.right)
      .attr('height', this.height+30)
    .append('g')
      .attr('transform', 'translate('+this.margin.right+',0)');
    var canvas = document.getElementById(this.div_id+"_overlay");

    line_xscale = d3.scaleLinear()
      .domain(d3.extent(data["X"], function(d) { return +d.year; }))
      .range([ 0, this.width ]);

    svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .attr('class', 'x axis')
      .call(d3.axisBottom(line_xscale)
        .tickFormat(d3.format("d"))
      );
    svg.append('g')
      .attr("class", "grid")
      .call(d3.axisBottom(line_xscale)
        .tickSize(this.height)
        .tickFormat("")
      );

    // common y axis for display
    var y = d3.scaleLinear()
      .domain([0, 1])
      .range([this.height, 0]);
    svg.append("g").attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickFormat("")
        .tickValues([0, 0.25, 0.5, 0.75, 1])
      );

    var area_svg = svg.append('g');
    var path_svg = svg.append('g');

    var selectedAxis = ["X", "Y", "S"];
    var axisColors = ["#000", "#444", "#888"];
    var y_scale = {}
    for (var i = 0; i < 3; i++) {
      var axis = selectedAxis[i];
      // console.log([d3.min(data[axis], function(d) { return d.min; }), d3.max(data[axis], function(d) { return d.max; })]);
      y_scale[axis] = d3.scaleLinear()
        .domain([d3.min(data[axis], function(d) { return d.min; }), d3.max(data[axis], function(d) { return d.max; })])
        .range([ this.height, 0 ]);

      var y_min = data[axis][0].value;
      var y_pos = Math.min(y(0.02), y_scale[axis](y_min)-20*(1-i));
      path_svg.append("rect")
        .attr("x", line_xscale(1800)-30)
        .attr("y", y_pos-10)
        .attr("width", 20)
        .attr("height", 20)
        .attr("class", this.div_id)
        .attr("axis", axis)
        .style("fill", axisColors[i])
        .on("mouseover", mouseOverPaths)
        .on("mouseout", mouseOutPaths)
      path_svg.append("line")
        .attr("x1", line_xscale(1800)-12)
        .attr("y1", y_pos)
        .attr("x2", line_xscale(1800))
        .attr("y2", y_scale[axis](y_min))
        .attr("class", this.div_id)
        .attr("axis", axis)
        .attr("stroke", axisColors[i])
        .attr("stroke-width", 1.5)
      path_svg.append("text")
        .attr("x", line_xscale(1800)-25)
        .attr("y", y_pos+6)
        .text(axis)
        .attr("class", this.div_id)
        .attr("axis", axis)
        .style("fill", "#fff")
        .on("mouseover", mouseOverPaths)
        .on("mouseout", mouseOutPaths)

      area_svg.append("path")
        .datum(data[axis])
        .attr("class", this.div_id)
        .attr("type", "area")
        .attr("axis", axis)
        .attr("fill", "#ccc")
        .attr("opacity", 0.4)
        .attr("stroke", "none")
        .attr("d", d3.area()
          .x(function(d) { return line_xscale(d.year) })
          .y0(function(d) { return y_scale[axis](d.min) })
          .y1(function(d) { return y_scale[axis](d.max) })
        )
        .on("mouseover", mouseOverPaths)
        .on("mouseout", mouseOutPaths)

      path_svg.append("path")
        .datum(data[axis])
        .attr("class", this.div_id)
        .attr("type", "path")
        .attr("axis", axis)
        .attr("fill", "transparent")
        .attr("stroke", axisColors[i])
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return line_xscale(d.year) })
          .y(function(d) { return y_scale[axis](d.value) })
        )
        .on("mouseover", mouseOverPaths)
        .on("mouseout", mouseOutPaths)
    }

    canvas.onmousemove = function(e) { draw_rect_move(e, this); };
    canvas.onclick = function(e) { draw_rect_click (e, this); };

  }
}

var element = null;
var mouse = {
  x: 0,
  y: 0,
  startX: 0,
  startY: 0
};
function draw_rect_input(range, div_id) {
  var ys = line_xscale(range[0]-0.5),
      ye = line_xscale(range[range.length-1]+0.5);
  // console.log("draw_rect_input", range, ys, ye, div_id);
  var canvas = document.getElementById(div_id+"_overlay");

  var rect = canvas.getBoundingClientRect();
  var e = document.createElement('div');
  e.className = 'select_rectangle'
  e.style.left = (ys+overlay_offset) + 'px';
  e.style.top = 0;
  e.style.width = Math.abs(ye - ys) + 'px';
  e.style.height = rect.height-30;
  canvas.appendChild(e)
}
function draw_rect_move(e, canvas) {
  var rect = canvas.getBoundingClientRect();
  if (element !== null) {
    setMousePosition(e);
    element.style.width = Math.abs(mouse.x - mouse.startX) + 'px';
    // element.style.height = Math.abs(mouse.y - mouse.startY) + 'px';
    element.style.height = rect.height-30;
    element.style.left = (mouse.x - mouse.startX < 0) ? mouse.x - rect.x + 'px' : mouse.startX - rect.x + 'px';
    // element.style.top = (mouse.y - mouse.startY < 0) ? mouse.y - rect.y + 'px' : mouse.startY - rect.y + 'px';
    element.style.top = 0;
  }
}
function draw_rect_click(e, canvas) {
  var rect = canvas.getBoundingClientRect();
  setMousePosition(e);
  // console.log("draw_rect_click", rect);
  if (element !== null) {
    names = canvas.id.split("_");
    left = +element.style.left.split("px")[0] - overlay_offset;
    width = +element.style.width.split("px")[0];
    // console.log("canvas - left", left_offset, left, line_xscale.invert(left));
    // console.log("canvas - right", left+width, line_xscale.invert(left+width));
    startYear = Math.floor(line_xscale.invert(left));
    endYear = Math.floor(line_xscale.invert(left+width));
    // console.log("selectedYears", startYear, endYear);
    years = Array.from(new Array(endYear-startYear), (x,i) => i + startYear)
    drawFrame(years, gname.indexOf(names[2]), names[3]);
    canvas.style.cursor = "default";
    // console.log("finsihed.", element);
    element = null;
  } else {
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    element = document.createElement('div');
    element.className = 'select_rectangle'
    element.style.left = mouse.x - rect.x + 'px';
    element.style.top = 0;
    // element.style.top = mouse.y - rect.y + 'px';
    // console.log("begun.", element);
    canvas.appendChild(element)
    canvas.style.cursor = "crosshair";
  }
}
function setMousePosition(e) {
  var ev = e || window.event; //Moz || IE
  if (ev.pageX) { //Moz
    mouse.x = ev.pageX + window.pageXOffset;
    mouse.y = ev.pageY + window.pageYOffset;
  } else if (ev.clientX) { //IE
    mouse.x = ev.clientX + document.body.scrollLeft;
    mouse.y = ev.clientY + document.body.scrollTop;
  }
  // console.log(mouse)
}

function mouseOverPaths(d) {
  // console.log("mouseOverPaths", this.className.baseVal)
  selected_axis = this.getAttribute("axis")
  var otherpaths = document.querySelectorAll("."+this.className.baseVal);
  for (var i = 0; i < otherpaths.length; i++) {
    if (otherpaths[i].getAttribute("axis") != selected_axis) {
      otherpaths[i].style.visibility = "hidden";
    } else if (otherpaths[i].getAttribute("type") == "area") {
      otherpaths[i].style.opacity = 0.7;
    }
  }
}

function mouseOutPaths(d) {
  // console.log("mouseOutPaths", this.className.baseVal)
  var otherpaths = document.querySelectorAll("."+this.className.baseVal);
  for (var i = 0; i < otherpaths.length; i++) {
    otherpaths[i].style.visibility = "visible";
    if (otherpaths[i].getAttribute("type") == "area") {
      otherpaths[i].style.opacity = 0.4;
    }
  }
}
