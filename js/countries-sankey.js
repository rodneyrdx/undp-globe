var canvas = d3.select("#sankey-canvas")
    .style("position", "absolute");

var margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = 1060 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var
/*formatNumber = d3.format(",.0f"),
   format = function(d) { return formatNumber(d) + " TWh"; },*/
    color = d3.scaleOrdinal(d3.schemeCategory10)

var sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([
        [1, 1],
        [width - 1, height - 6]
    ]);
var svgSankey = d3.select("#svgSankey");

var sankeyDefs = svgSankey.append("defs");

var link = svgSankey.append("g")
    .attr("class", "links")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-opacity", 0.2)
    .selectAll("path");

var node = svgSankey.append("g")
    .attr("class", "nodes")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g");


var freqCounter = 3;


d3.json("/data/sankey-data1.json", function(cdata) {

    sankey(cdata);
    /*.nodes(cdata.nodes)
    .links(cdata.links)
    .layout(35, 8);*/

    link = link
        .data(cdata.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .style("stroke", function(d, i) {

            // create the gradient
            var gradient_id = "gradient-" + i;
            var gradient = sankeyDefs.append("linearGradient")
                .attr("id", gradient_id);
            gradient.append("stop")
                .attr("offset", "5%")
                .attr("stop-color", color(d.source.name.replace(/ .*/, "")));
            gradient.append("stop")
                .attr("offset", "95%")
                .attr("stop-color", color(d.target.name.replace(/ .*/, "")));

            return i == 0 ? color(d.source.name.replace(/ .*/, "")) : "url(#" + gradient_id + ")";
        })
        .attr("stroke-width", function(d) { return Math.max(1, d.width); })
        .on("mouseover", function(d, i) {
            d3.selectAll("path.link").attr("stroke-opacity", 0.06);
            //TODO: highlight connected links
            //var datum = d3.select(this).datum();
            /*var sourceNode = d3.select(this).datum().source;*/
            var sourceLinks = d3.select(this).datum().source.sourceLinks;
            sourceLinks.forEach(function(element) {
                d3.select(element.node).attr("stroke-opacity", 0.06);
            }, this);
            d3.select(this).attr("stroke-opacity", 1);
        })
        .on("mouseout", function() {
            d3.selectAll("path.link").attr("stroke-opacity", 0.2);
        });

    link.append("title")
        .text(function(d) { return d.source.name + " → " + d.target.name /* + "\n" + format(d.value)*/ ; });

    /*link
        .on('mouseover', function() {
            d3.select(this)
                .style('stroke-opacity', 0.25);
        })
        .on('mouseout', function() {
            d3.select(this)
                .style('stroke-opacity', 0.15);
        });*/

    node = node
        .data(cdata.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x0 + "," + d.y0 + ")";
        })
        .call(d3.drag()
            .subject(function(d) {
                return d;
            })
            .on("start", function() {
                this.parentNode.appendChild(this);
            })
            .on("drag", dragmove));

    node.append("rect")
        /*.attr("x", function(d) {
            return d.x0;
        })
        .attr("y", function(d) {
            return d.y0;
        })*/
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("fill", function(d) { return color(d.name.replace(/ .*/, "")); })
        .attr("stroke", "#000");

    node.append("text")
        .attr("dx", function(d) { return -6; })
        .attr("dy", function(d) { return (d.y1 - d.y0) / 2; })
        /*.attr("dy", "0.35em")*/
        .attr("text-anchor", "end")
        .text(function(d) { return d.name; })
        .filter(function(d) { return d.x0 < width / 2; })
        .attr("x", function(d) { return 26; })
        .attr("text-anchor", "start");

    node.append("title")
        .text(function(d) { return d.name /* + "\n" + format(d.value)*/ ; });

    function dragmove(d) {
        d.y0 = d.y0 + d3.event.dy;
        d3.select(this).attr('transform', `translate(${d.x0},${d.y0 + d3.event.dy})`);
        sankey.update(cdata);
        link.attr('d', d3.sankeyLinkHorizontal());
    }


    /*var linkExtent = d3.extent(cdata.links, function(d) { return d.value });
    var frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05, 1]);
    var particleSize = d3.scaleLinear().domain(linkExtent).range([1, 5]);


    cdata.links.forEach(function(lnk) {
        lnk.freq = frequencyScale(lnk.value);
        lnk.particleSize = 1;
        lnk.particleColor = d3.scaleLinear().domain([1, 1000]).range([lnk.source.color, lnk.target.color]);
    })

    var t = d3.timer(tick, 1000);
    var particles = [];

    function tick(elapsed, time) {

        particles = particles.filter(function(d) { return d.current < d.path.getTotalLength() });

        d3.selectAll("path.link")
            .each(
                function(d) {
                    //        if (d.freq < 1) {
                    for (var x = 0; x < 2; x++) {
                        var offset = (Math.random() - .5) * (d.dy - 4);
                        if (Math.random() < d.freq) {
                            var length = this.getTotalLength();
                            particles.push({ link: d, time: elapsed, offset: offset, path: this, length: length, animateTime: length, speed: 0.5 + (Math.random()) })
                        }
                    }
                });

        particleEdgeCanvasPath(elapsed);
    }*/


    function particleEdgeCanvasPath(elapsed) {
        var context = d3.select("canvas").node().getContext("2d")

        context.clearRect(0, 0, 1000, 1000);

        context.fillStyle = "gray";
        context.lineWidth = "1px";
        for (var x in particles) {
            var currentTime = elapsed - particles[x].time;
            //        var currentPercent = currentTime / 1000 * particles[x].path.getTotalLength();
            particles[x].current = currentTime * 0.15 * particles[x].speed;
            var currentPos = particles[x].path.getPointAtLength(particles[x].current);
            context.beginPath();
            context.fillStyle = particles[x].link.particleColor(0);
            context.arc(currentPos.x, currentPos.y /* + particles[x].offset*/ , particles[x].link.particleSize, 0, 2 * Math.PI);
            context.fill();
        }
    }


});