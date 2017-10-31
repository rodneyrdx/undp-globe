var globe = function(options) {
    var width = options.width; //775,
    height = options.height; //600;

    var radius = 260;
    var lngLmt = 80;

    var proj = d3.geoOrthographic()
        .translate([width / 2, height / 2])
        .clipAngle(90)
        .scale(radius);

    var path = d3.geoPath().projection(proj).pointRadius(2);


    var svg = d3.select(".svg-wrapper").append("svg")
        .attr("width", width)
        .attr("height", height);

    var ocean = undefined;
    var shadow = undefined;
    var globe = undefined;
    var globeShading = undefined;
    var centroids = undefined;

    queue()
        .defer(d3.json, "/data/world-countries.json")
        .defer(d3.csv, "/data/data.csv")
        .await(ready);

    function ready(error, world, countryData) {
        var ocean_fill = svg.append("defs").append("radialGradient")
            .attr("id", "ocean_fill")
            .attr("cx", "75%")
            .attr("cy", "25%");
        ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#fff");
        ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#ababab");

        var globe_highlight = svg.append("defs").append("radialGradient")
            .attr("id", "globe_highlight")
            .attr("cx", "75%")
            .attr("cy", "25%");
        globe_highlight.append("stop")
            .attr("offset", "5%").attr("stop-color", "#ffd")
            .attr("stop-opacity", "0.6");
        globe_highlight.append("stop")
            .attr("offset", "100%").attr("stop-color", "#ba9")
            .attr("stop-opacity", "0.2");

        var globe_shading = svg.append("defs").append("radialGradient")
            .attr("id", "globe_shading")
            .attr("cx", "55%")
            .attr("cy", "45%");
        globe_shading.append("stop")
            .attr("offset", "30%").attr("stop-color", "#fff")
            .attr("stop-opacity", "0")
        globe_shading.append("stop")
            .attr("offset", "100%").attr("stop-color", "#505962")
            .attr("stop-opacity", "0.3")

        var drop_shadow = svg.append("defs").append("radialGradient")
            .attr("id", "drop_shadow")
            .attr("cx", "50%")
            .attr("cy", "50%");
        drop_shadow.append("stop")
            .attr("offset", "20%").attr("stop-color", "#000")
            .attr("stop-opacity", ".5");
        drop_shadow.append("stop")
            .attr("offset", "100%").attr("stop-color", "#000")
            .attr("stop-opacity", "0");

        shadow = svg.append("ellipse")
            .attr("cx", 400)
            .attr("cy", height / 2 + radius + 10)
            .attr("rx", proj.scale() * .90)
            .attr("ry", proj.scale() * .25)
            .attr("class", "noclicks")
            .style("fill", "url(#drop_shadow)");

        ocean = svg.append("circle")
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class", "noclicks")
            .style("fill", "url(#ocean_fill)");

        globeShading = svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            //.attr("class", "noclicks")
            .on("click", function() {
                //preventDefault();

                changeFocus(undefined);
                if (!touring && !spinning) {
                    rotate2().then(function() {
                        spin();
                    })
                }
                return false;
            })
            .style("fill", "url(#globe_shading)");


        if (!world.features) return null;

        world.features.forEach(function(c) {
            centroids = proj(d3.geoCentroid(c));
            country_names[c.properties.name] = c;
            id_to_names[c.id] = c.properties.name;
        });

        svg.append("g").attr("class", "country")
            .selectAll("country")
            .data(world.features)
            .enter().append("path")
            .attr("d", path)
            .on("mouseover", options.events.landMouseOver)
            .on("mouseout", options.events.landMouseOut)
            .on("mousemove", options.events.landMouseMove)
            .on("click", options.events.landMouseClick)
            .attr("id", function(d, i) {
                return d.id;
            });

        var λ = d3.scaleLinear()
            .domain([0, width])
            .range([-180, 180]);

        var φ = d3.scaleLinear()
            .domain([0, width])
            .range([90, -90]);

        svg
            .call(d3.drag()
                .subject(function() {
                    var r = proj.rotate();
                    return {
                        x: λ.invert(r[0]),
                        y: φ.invert(r[1])
                    };
                })
                .on("drag", function() {
                    spin(false);
                    var lat = λ(d3.event.x);
                    var lng = φ(d3.event.y);
                    lng = lng > lngLmt ? lngLmt : lng < -lngLmt ? -lngLmt : lng;

                    // insure that spinning globe is in sync with this transition
                    //spin_rotation = [lat, lng];
                    //spin_start = Date.now();

                    proj.rotate([lat, lng]);
                    //space.rotate([-lat, -lng]);
                    refresh();
                }))
            .call(d3.zoom()
                .on('zoom', function() {
                    proj.scale(radius * d3.event.transform.k);
                    refresh();
                }))

        countryData.forEach(function(c) {
            var activeCountry = c.Status === "Active";
            if (c.Country && c.Country.length == 3) {
                if (!data_per_country[c.Country]) {
                    data_per_country[c.Country] = {};
                }
                if (!data_per_country[c.Country][c.Disease]) {
                    data_per_country[c.Country][c.Disease] = [];
                }
                data_per_country[c.Country][c.Disease].push(c);

                if (!data_per_disease[c.Disease]) {
                    data_per_disease[c.Disease] = {};
                }
                if (!data_per_disease[c.Disease][c.Country]) {
                    data_per_disease[c.Disease][c.Country] = [];
                }
                data_per_disease[c.Disease][c.Country].push(c);

                d3.select("#" + c.Country)
                    .classed(c.Disease, true)
                    .classed(c.Disease + "-inactive", !activeCountry)
                    .classed(c.Status + "Country", true);
            }
        });

        globe = svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class", "noclicks")
            .style("fill", "url(#globe_highlight)");

        svg.append("g").attr("class", "labels")
            .selectAll("text").data(world.features)
            .enter().append("text")
            .filter(function(d) {
                return data_per_country[d.id] != undefined
            })
            .attr("class", "label shown noclicks")
            .text(function(d) { return d.properties.name })

        position_labels();
        //onGlobeDraw();
        refresh();
        spin();
    }

    function position_labels() {
        var centerPos = proj.invert([width / 2, height / 2]);

        //var arc = d3.geoDistance();

        svg.selectAll(".label")
            .attr("text-anchor", function(d) {
                var x = proj(d3.geoCentroid(d))[0];
                return x < width / 20 - 5 ? "end" :
                    x < width / 20 + 5 ? "middle" :
                    "start"
            })
            .attr("transform", function(d) {
                var loc = proj(d3.geoCentroid(d)),
                    x = loc[0],
                    y = loc[1];
                var offset = x < width / 2 ? -5 : 5;
                return "translate(" + (x + offset) + "," + (y - 2) + ")"
            })
            .style("display", function(d) {
                var dist = d3.geoDistance(d3.geoCentroid(d), centerPos);
                if (d.id != '-99') {
                    return (dist < 1.57 && d3.select("#" + d.id).classed("ActiveCountry")) ? 'inline' : 'none';
                }

            })

    }

    function refresh() {
        svg.selectAll("path").attr("d", path);
        if (ocean) {
            ocean.attr("r", proj.scale());
        }
        if (globe) {
            globe.attr("r", proj.scale());
        }
        if (globeShading) {
            globeShading.attr("r", proj.scale());
        }
        if (shadow) {
            shadow.attr("cx", width / 2 - 60).attr("cy", height / 2 + radius * proj.scale() * .0090 - 90)
                .attr("rx", proj.scale() * .90)
                .attr("ry", proj.scale() * .25)
        }
        position_labels();
    }

    var speed = 1e-2;
    var spin_timer;
    /*var spinning = false;*/

    function spin(spin) {
        spin = spin == undefined ? true : spin;
        if (spin) {
            spinning = true
            spin_timer = d3.timer(function(elapsed) {
                proj.rotate([-speed * elapsed, 0, 0]);
                refresh();
            });
        } else if (spin_timer) {
            spinning = false;
            spin_timer.stop();
            spin_timer = undefined;
        }
    }

    function coords(coords, scale) {
        return new Promise(function(resolve, reject) {
            var current = proj.rotate();

            coords = coords || proj.rotate();
            scale = scale || proj.scale();
            scale = Math.max(radius, scale);

            // if already at target coordinates, do nothing; resolve.
            if (current[0] == coords[0] && current[1] == coords[1] && current[2] == coords[2] && scale == proj.scale()) {
                resolve();
                return;
            }

            // insure that spinning globe is in sync with this transition
            spin_rotation = coords;
            spin_start = Date.now();

            svg.transition()
                .duration(1500)
                .tween("rotate", function() {
                    var r = d3.interpolate(proj.rotate(), coords);
                    var s = d3.interpolate(proj.scale(), scale);
                    return function(t) {
                        proj.rotate(r(t)).scale(s(t));
                        refresh();
                    };
                })
                .on('end', resolve);
        });
    };

    function zoom2(what, which, zoom) {
        return new Promise(function(resolve, reject) {
            which = which || 'country';
            zoom = zoom == undefined ? false : zoom;
            var coordsW = [0, 0, 0];
            var scale = radius;

            if (Object.keys(country_names).indexOf(what) >= 0) {
                coordsW = d3.geoCentroid(country_names[what]).map(function(m) {
                    return -1 * m;
                });
                var b = d3.geoBounds(country_names[what]);
                var dx = b[1][0] - b[0][0];
                var dy = b[1][1] - b[0][1];
                var x = (b[0][0] + b[1][0]) / 2;
                var y = (b[0][1] + b[1][1]) / 2;
                bbox = .1 / Math.max(dx / width, dy / height);
                scale = zoom ? radius * bbox : radius;
                scale = Math.max(scale, radius);
                changeFocus(country_names[what].id);
            } else {
                changeFocus(undefined);
            }

            if (coordsW.length == 2) coordsW.push(0);
            coords(coordsW, radius * 1.5)
                .then(resolve, reject);
        });
    }

    function rotate2(coordsW) {
        coordsW = coordsW || [0, 0, 0];
        hideCountryInfo();
        return coords(coordsW, radius);
    }

    function bounce2(what, which) {
        return new Promise(function(resolve, reject) {
            rotate2().then(function() {
                zoom2(what, which).then(resolve, reject);
            }, reject)
        });
    }

    function scale(scale_pct) {
        if (!arguments.length) return +((proj.scale() / radius) * 100).toFixed(2);
        var scale = scale_pct / 100 * radius;
        return coords(undefined, scale, true);
    }

    function changeFocus(focusID) {
        if (focusID == undefined && !touring && !spinning) {
            rotate2();
            hideCountryInfo();
        }
        if (focusID && spinning) {
            spin(false);
        }
        svg.selectAll("path")
            .classed("focused", function(d, i) {
                var result = focusID && d && d.id && d.id == focusID ? current_focus = d.id : false;
                if (result && disease) {
                    showCountryInfo(focusID, disease);
                }
                return result;
            });

    }

    var tour_countries = [];
    var tourDelay = 3000;

    function tour(start, bounce) {
        start = start == undefined ? true : start;
        //disease = disease == undefined ? "HIV" : disease;
        bounce = bounce == undefined ? true : bounce;

        if (disease) {
            tour_countries = Object.keys(data_per_disease[disease]).sort();
        }

        return new Promise(function(resolve, reject) {
            if (!start || !disease) {
                touring = false;
                tour_countries = [];
                return resolve();
            }
            if (spinning) {
                spin(false);
            }
            touring = true;

            nextCountry();

            function nextCountry() {
                if (!tour_countries.length || !touring) {
                    return resolve();
                }
                country = id_to_names[tour_countries.pop()];

                if (!country) {
                    nextCountry();
                } else {
                    //console.log(country);
                    if (bounce) {
                        bounce2(country)
                            .then(delayNext, reject);
                    } else {
                        zoom2(country, undefined, false)
                            .then(delayNext, reject);
                    }
                }
            }

            function delayNext() {
                //showCountryInfo(country, disease);
                setTimeout(function() {
                    nextCountry();
                }, tourDelay);

            }
        });
    }

    return {
        tour: tour,
        changeFocus: changeFocus,
        bounce2: bounce2,
        spin: spin,
        rotate2: rotate2,
        /*disease: disease,*/
        coords: coords,
        current_focus: current_focus
    }

};