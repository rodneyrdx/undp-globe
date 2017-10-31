function geoFlow() {

    var data = { countries: { features: [] }, countryData: [], cities: { features: [] }, occasions: { features: [] } };

    var options = {
        id: undefined,
        width: window.innerWidth,
        height: window.innerHeight,
        display: {
            stars: 0,
            cities: false,
            occasions: false,
            flows: false,
            transform: 1.6,
            sizeToFit: true, // parent element externally sized
        },
        zoom: {
            northup: true,
            lngLmt: 80,
            time: 1500,
        },
        user: {
            location: true,
            update: false, // updates on load; when true can interrupt transitions
            stroke: "blue",
            fillOpacity: 0.2,
            fill: "white"
        },
        world: {
            surround: undefined,
            velocity: [.01, -0],
        },
        map: {
            dragging: true,
            ortho: true
        },
        cities: {
            "fill": "#1075fe",
            "fillOpacity": 0.5,
            "stroke": "#1075fe",
            "strokeOpacity": 0.2,
        },
        graticule: {
            outline: {
                fill: '#def',
                stroke: '#000',
                width: '0px',
            },
            fill: '#def',
            stroke: '#FFF',
            width: '0px'
        },
        geodesic: {
            fill: 'none',
            stroke: '#FFF',
            width: '0px'
        },
        oceans: {
            fill: '#def',
        },
        land: {
            focus: undefined,
            fill: undefined,
            stroke: '#fff'
        },
        tour: {
            delay: 1500,
        }
    };

    // consider replacing with an externally definable function
    options.radius = Math.min(options.height * .45, options.width * .45);

    var events = {
        'ready': null,
        'settings': { 'click': null },
        'update': { 'begin': null, 'end': null },
        'land': { 'mouseover': null, 'mouseout': null, 'click': null },
        'city': { 'mouseover': null, 'mouseout': null, 'click': null },
    };

    var starList = createStars(300);
    var country_names = {};
    var spin_rotation;
    var spin_start;

    var projectionGlobe;
    var projectionGraticule;
    var projectionMap;
    var projection;
    var spacePath;
    var background;
    var geoPath;
    var world;
    var surface;
    var poi;

    var update;

    var user_position;
    navigator.geolocation.getCurrentPosition(function(pos) {
        user_position = pos;
        if (typeof update == 'function' && options.user.update) update();
    });

    function globe(selection) {
        selection.each(function() {
            var dom_parent = d3.select(this);

            var color = d3.scaleOrdinal(d3.schemeCategory20);

            world = dom_parent.append("svg")
            background = world.append("g").attr('id', 'space');
            surface = world.append("g").attr('id', 'surface');
            poi = world.append("g").attr('id', 'poi');

            /*var graticule = d3.geoGraticule();
            var g_outline = surface.append("g")
                .attr("id", "g_outline")
                .append("path")
                .attr("class", "graticule outline path")
                .datum(graticule.outline)*/

            var oceans = surface.append("g")
                .attr('id', 'oceans')
            var ocean_defs = oceans.append('defs');
            var ocean = ocean_defs.append("path")
                .datum({ type: "Sphere" })
                .attr("id", "sphere")
                .attr("class", "sphere ocean path")
            oceans.append("use")
                .attr("class", "sphere")
                .attr("xlink:href", "#sphere");

            var grid = surface.append("g").attr('id', 'graticule');
            var landfeatures = surface.append("g").attr('id', 'land');
            var cityfeatures = poi.append("g").attr('id', 'cities');
            var occasions = poi.append('g').attr('id', 'occasions');

            var g_line = grid.append("path")
                .datum(graticule)
                .attr("class", "graticule line path");

            var gd_line;
            if (d3.geodesic) {
                gd_line = grid.append("path")
                    .datum(d3.geodesic.multilinestring(7))
                    .attr("class", "graticule path")
            }

            update = function(opts) {

                // resize to dimensions of containing element
                if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
                    var dims = dom_parent.node().getBoundingClientRect();
                    options.width = Math.max(dims.width, 200);
                    options.height = Math.max(Math.min(dims.height, window.innerHeight), 200);
                }

                options.radius = Math.min(options.height * .45, options.width * .45);

                world
                // .attr({
                    .attrs({
                        'width': options.width,
                        'height': options.height,
                    })
                    // .style({
                    .styles({
                        'background': options.world.surround,
                        'pointer-events': 'all'
                    });

                // preserve any prior scale
                if (options.map.ortho) {
                    var scale = projection ? projection.scale() : options.radius;
                    var scale = opts && opts.sizeToFit ? options.radius : scale;
                } else {
                    var scale = projection ? projection.scale() : options.radius / options.display.transform;
                    var scale = opts && opts.sizeToFit ? options.radius / options.display.transform : scale;
                }

                var space = d3.geoAzimuthalEquidistant()
                    .scale(450)
                    .rotate([80, -90, 0])
                    .center([0, 0]);

                spacePath = d3.geoPath()
                    .projection(space)
                    .pointRadius(2);

                projectionGlobe = d3.geoOrthographic()
                    .scale(scale)
                    .center([0, 0])
                    .translate([options.width / 2, options.height / 2])
                    .clipAngle(90);

                projectionMap = d3.geoEquirectangular()
                    .scale(scale)
                    .center([0, 0])
                    .translate([options.width / 2, options.height / 2])

                // preserve any prior rotation
                var rotation = projection ? projection.rotate() : [0, 0, 0];
                projection = options.map.ortho ? projectionGlobe : projectionMap;
                projection.rotate(rotation);

                geoPath = d3.geoPath().projection(projection);

                ocean
                    .attr("d", geoPath);

                var ocean_fill = world.append("defs").append("radialGradient")
                    .attr("id", "ocean_fill")
                    .attr("cx", "75%")
                    .attr("cy", "25%");
                ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#ddf");
                ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#9ab");

                ocean.styles({
                    'fill': options.oceans.fill,
                    'stroke': 'none',
                    'stroke-width': '1px',
                });

                g_line
                    .attr("d", geoPath)
                    .styles({
                        'fill': options.graticule.fill,
                        'stroke': options.graticule.stroke,
                        'stroke-width': options.graticule.width,
                    });

                if (d3.geodesic) {
                    /*gd_line
                        .attr("d", geoPath)
                        .styles({
                            'fill': options.geodesic.fill,
                            'stroke': options.geodesic.stroke,
                            'stroke-width': options.geodesic.width,
                        });*/
                }

                /*if (rotation[0] == 0 && rotation[1] == 0 && rotation[2] == 0) {
                    g_outline
                        .attr("d", geoPath)
                        .styles({
                            'fill': options.graticule.outline.fill,
                            'stroke': options.graticule.outline.stroke,
                            'stroke-width': options.graticule.outline.width
                        });
                }*/

                var λ = d3.scaleLinear()
                    .domain([0, options.width])
                    .range([-180, 180]);

                var φ = d3.scaleLinear()
                    .domain([0, options.width])
                    .range([90, -90]);

                world
                    .call(d3.drag()
                        .subject(function() { var r = projection.rotate(); return { x: λ.invert(r[0]), y: φ.invert(r[1]) }; })
                        .on("drag", function() {
                            if (options.map.dragging) {
                                var lat = λ(d3.event.x);
                                var lng = φ(d3.event.y);
                                lng = lng > options.zoom.lngLmt ? options.zoom.lngLmt : lng < -options.zoom.lngLmt ? -options.zoom.lngLmt : lng;

                                // insure that spinning globe is in sync with this transition
                                spin_rotation = [lat, lng];
                                spin_start = Date.now();

                                projection.rotate([lat, lng]);
                                space.rotate([-lat, -lng]);
                                reDraw();
                            }
                        }))

                addLand();
                //addCities();
                //addStars();
                //addOccasions();
                //addFlows();
                //addUserLocation();
                reDraw();

                function addLand() {
                    var land = landfeatures.selectAll("path.countries")
                        .data(data.countries.features)

                    land.exit().remove();

                    land.enter()
                        .append("path")
                        .attr("class", "countries path")
                        .on("mouseover", events.land.mouseover)
                        .on("mouseout", events.land.mouseout)
                        .on("mousemove", events.land.mousemove)
                        .on("click", events.land.click)
                        .merge(land)
                        .attr("d", geoPath)
                        .attr("id", function(d, i) {
                            return d.id;
                        })
                        .styles({
                            'fill': landColor, // disables CSS functionality
                            'stroke': options.land.stroke,
                        });

                    function landColor(d, i) {
                        if (data.neighbors) {
                            if (d.color) return d.color;
                            return color(d.color = d3.max(data.neighbors[i], function(n) { return data.countries.features[n].color; }) + 1 | 0);
                        } else {
                            return options.land.fill;
                        }
                    }

                    data.countryData.forEach(function(c) {
                        var activeCountry = c.Status === "1";
                        if (c.Country.length == 3) {
                            d3.select("#" + c.Country)
                                .classed(c.Disease, true)
                                .classed(c.Disease + "-inactive", !activeCountry)
                        }
                    });


                }
                /*
                            function addCities() {

                               if (!options.display.cities) {
                                  cityfeatures.selectAll("path.cities").remove();
                                  return;
                               }

                               var population_array = data.cities.features.map(function(f) { return f.properties.population; });
                               var max_population = population_array.sort(d3.descending)[0];

                               if (max_population) {
                                  var rMin = 0;
                                  var peoplePerPixel = 20000000 / options.radius; // consider making this configurable
                                  var rMax = Math.sqrt(max_population / (peoplePerPixel * Math.PI));

                                  // var rScale = d3.scale.sqrt();
                                  var rScale = d3.scaleSqrt();
                                  rScale.domain([0, max_population]);
                                  rScale.range([rMin, rMax]);

                                  data.cities.features.forEach(function(c) {
                                     c.properties.radius = rScale(c.properties.population);
                                  });
                               }

                               var cities = cityfeatures.selectAll("path.cities")
                                  .data(data.cities.features)

                               cities.exit().remove();

                               cities.enter()
                                  .append("path")
                                  .attr("class", "cities")
                                 .merge(cities)
                                  .attr("d", pointPath)
                                  .styles({
                                     "fill": options.cities.fill,
                                     "fill-opacity": options.cities.fillOpacity,
                                     "stroke": options.cities.stroke,
                                     "stroke-opacity": options.cities.strokeOpacity,
                                  })
                                  .on("click",  function(d, i) {		
                                     globe.zoom2(i, 'city');
                                     d3.selectAll('.cities').classed('city-selected', false);
                                     d3.select(this).classed("city-selected", true);
                                  });
                            }

                            function addOccasions() {

                               if (!options.display.occasions || !data.occasions.features.length) {
                                  occasions.selectAll('g').remove();
                                  return;
                               }

                               var og = occasions.selectAll('g')
                                  .data(data.occasions.features);

                               og.exit().remove();

                               og.enter().append('g')
                                  .attrs({
                                     'class': 'occasion',
                                     'id': function(d) { return d.id; },
                                  })

                               var pc = og.selectAll('.pulse-circle')
                                  .data(function(d) { return [d]; }, get_key);

                               pc.exit().remove();

                               pc.enter()
                                  .append("path")
                                  .attr('class', 'occ pulse-circle')
                                 .merge(pc)
                                  .style("fill", 'white')
                                  .attr("d", pointPath)
                                  
                               var oc = og.selectAll('.oc-circle')
                                  .data(function(d) { return [d]; }, get_key);

                               oc.exit().remove();

                               oc.enter()
                                  .append('path')
                                  .attr('class', 'occ oc-circle')
                                 .merge(oc)
                                  .attr("d", pointPath)
                                  .styles({ 
                                     "fill" : 'red',
                                     'opacity': 0.75,
                                  })

                               var oct = oc.selectAll('.oct')
                                  .data(function(d) { return [d]; }, get_key);

                               oct.exit().remove();

                               oct.enter().append('title')
                                  .attr('class', 'oct')
                                 .merge(oct)
                                  .text(function(d) {
                                     return 'Magnitue ' + d.properties.mag + ' ' + d.properties.place;
                                  })
                            }

                            function addFlows() {

                               if (!options.display.flows || !data.occasions.features.length) {
                                  cityfeatures.selectAll(".arcPath").remove();
                                  return;
                               }

                               var points = data.occasions.features.map(m => m.geometry.coordinates)
                               for (var n = 1, e = points.length, coords = []; ++n < e;) {
                                  coords.push({ type: "LineString", coordinates: [points[n-1], points[n]] });
                               }

                               var arcs = cityfeatures.selectAll(".arcPath")
                                  .data(coords);

                               arcs.exit().remove();

                               arcs
                                  .enter()
                                  .append("path")
                                 .merge(arcs)
                                  .attrs({
                                     'class': 'arcPath path',
                                     'fill': 'none',
                                     'stroke': 'red',
                                     'stroke-width': '1px'
                                  })
                                  .attr("d", geoPath)
                            }

                            function addUserLocation() {
                               if (!options.user.location || !user_position) {
                                  cityfeatures.selectAll('.userloc').remove();
                                  return;
                               }

                               var coords = [user_position.coords.longitude, user_position.coords.latitude];
                               var locations = cityfeatures.selectAll('.userloc')
                                  .data([coords]);

                               locations.exit().remove();

                               locations.enter().append("circle")
                                  .attr('class', 'userloc')
                                 .merge(locations)
                                  .attrs({
                                    cx: function(d) { return projection(d)[0] },
                                    cy: function(d) { return projection(d)[1] },
                                    r: options.radius / 20,    // consider making this configurable
                                  })
                                  .styles({
                                     "stroke": options.user.stroke,
                                     "fill-opacity": options.user.fillOpacity,
                                     "fill": options.user.fill
                                  });
                            }

                            function addStars() {
                               if (!options.display.stars)  {
                                  background.selectAll('path').remove();
                               }

                               var constellations = background.selectAll(".star")
                                  .data(starList);

                               constellations.exit().remove();

                               constellations.enter()
                                  .append("path")
                                  .attrs({
                                     "class": "star",
                                     "fill": "white"
                                  })
                                  .attr("d", function(d){
                                      spacePath.pointRadius(d.properties.radius);
                                      return spacePath(d);
                                  });
                            }
                */
            }
        });
    }

    // -------------------------- FUNCTIONS ----------------------------

    var get_key = function(d) { return d && d.key; };

    function animateTransition(interProj) {
        return new Promise(function(resolve, reject) {
            world.transition()
                .duration(2500)
                .tween("projection", function() {
                    return function(_) {
                        interProj.alpha(_);
                        reDraw(true);
                    };
                })
                .on('end', resolve);
        });
    }

    var pointPath = function(d, i, data, r) {
        if (d.properties && d.properties.radius != undefined) {
            r = r || d.properties.radius;
        }
        r = r || 1.5;
        var coords = [d.geometry.coordinates[0], d.geometry.coordinates[1]];
        var pr = geoPath.pointRadius(globe.scale() / 100 * r);
        var rez = pr({ type: "Point", coordinates: coords });
        return rez;
    }

    var circlePath = function(d) {
        var circle = d3.geo.circle();
        var coords = [d.geometry.coordinates[0], d.geometry.coordinates[1]];
        var cc = circle.origin(coords).angle(.5)();
        return geoPath(cc);
    }

    function reDraw() {
        //background.selectAll("path").attr("d", spacePath);
        surface.selectAll("path").attr("d", geoPath);
        //poi.selectAll(".path").attr("d", geoPath);
        //poi.selectAll('.cities').attr('d', pointPath)
        //poi.selectAll('.occ').attr('d', pointPath)
        /*poi.selectAll(".userloc")
            .attr('cx', function(d) { return projection(d)[0] })
            .attr('cy', function(d) { return projection(d)[1] })*/
    }

    globe.changeFocus = changeFocus;

    function changeFocus(focusID) {
        surface.selectAll("path")
            .classed("focused", function(d, i) {
                return focusID && d && d.id && d.id == focusID ? options.land.focus = d.id : false;
            });
    }

    // scale_pct is % of parent element (visible space); won't go below 100;
    globe.scale = function(scale_pct) {
        if (!arguments.length) return +((projection.scale() / options.radius) * 100).toFixed(2);
        var scale = scale_pct / 100 * options.radius;
        return globe.coords(undefined, scale, true);
    }

    globe.coords = function(coords, scale) {
        return new Promise(function(resolve, reject) {
            var current = projection.rotate();

            coords = coords || projection.rotate();
            scale = scale || projection.scale();
            scale = Math.max(options.map.ortho ? options.radius : options.radius / options.display.transform, scale);

            // if already at target coordinates, do nothing; resolve.
            if (current[0] == coords[0] && current[1] == coords[1] && current[2] == coords[2] && scale == projection.scale()) {
                resolve();
                return;
            }

            // insure that spinning globe is in sync with this transition
            spin_rotation = coords;
            spin_start = Date.now();

            world.transition()
                .duration(options.zoom.time)
                .tween("rotate", function() {
                    var r = d3.interpolate(projection.rotate(), coords);
                    var s = d3.interpolate(projection.scale(), scale);
                    return function(t) {
                        projection.rotate(r(t)).scale(s(t));
                        reDraw();
                    };
                })
                .on('end', resolve);
        });
    };

    globe.g2m = function() {
        return new Promise(function(resolve, reject) {
            if (!options.map.ortho) {
                globe.rotate2().then(resolve);
                return;
            }
            var current = projection.rotate();
            if (current[0] == 0 && current[1] == 0 && current[2] == 0) {
                transform();
            } else {
                globe.rotate2().then(transform);
            }

            function transform() {
                projection = interpolatedProjection(projectionGlobe, projectionMap, false);
                projection.scale(options.radius / options.display.transform);
                geoPath.projection(projection);
                animateTransition(projection)
                    .then(resolve, reject);
                surface.selectAll("path").classed("ortho", options.map.ortho = false);
            }
        });
    }

    globe.m2g = function() {
        return new Promise(function(resolve, reject) {
            if (options.map.ortho) {
                globe.rotate2().then(resolve);
                return;
            }
            var current = projection.rotate();
            if (current[0] == 0 && current[1] == 0 && current[2] == 0) {
                transform();
            } else {
                globe.rotate2().then(transform);
            }

            function transform() {
                projection = interpolatedProjection(projectionMap, projectionGlobe, true);
                projection.scale(options.radius);
                geoPath.projection(projection);
                animateTransition(projection)
                    .then(resolve, reject);
                surface.selectAll("path").classed("ortho", options.map.ortho = true);
            }
        })
    }

    globe.snap2 = function(coords, scale) {
        coords = coords || [0, 0, 0];
        scale = scale || options.radius;
        projection.rotate(coords).scale(scale);
        reDraw();
    }

    globe.rotate2 = function(coords) {
        coords = coords || [0, 0, 0];
        return globe.coords(coords, options.map.ortho ? options.radius : options.radius / options.display.transform);
    }

    globe.reset = function() {
        return new Promise(function(resolve, reject) {
            globe.spin(false);
            globe.tour(false);
            changeFocus(undefined);
            globe.rotate2()
                .then(finish, reject)

            function finish() {
                globe.update({ sizeToFit: true });
                resolve();
            }
        });
    }

    globe.pause = function(time) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve();
            }, time);
        });
    }

    globe.bounce2 = function(what, which) {
        return new Promise(function(resolve, reject) {
            globe.rotate2().then(function() { globe.zoom2(what, which).then(resolve, reject); }, reject)
        });
    }

    var tour_countries;
    // start can specify first country or false to terminate tour
    globe.tour = function(start, bounce) {
        start = start == undefined ? true : start;
        return new Promise(function(resolve, reject) {
            if (!start) {
                tour_countries = [];
                return resolve();
            }
            tour_countries = Object.keys(country_names).sort();
            if (typeof start == 'string') {
                var index = tour_countries.indexOf(start);
                if (index >= 0) {
                    tour_countries = tour_countries.slice(index).concat(tour_countries.slice(0, index)).reverse();
                } else {
                    tour_countries.reverse();
                }
            }

            nextCountry();

            function nextCountry() {
                if (!tour_countries.length) { return resolve(); }
                country = tour_countries.pop();

                if (!country) {
                    nextCountry();
                } else {
                    console.log(country);
                    if (bounce) {
                        globe.bounce2(country)
                            .then(delayNext, reject);
                    } else {
                        globe.zoom2(country, undefined, false)
                            .then(delayNext, reject);
                    }
                }
            }

            function delayNext(result) {
                setTimeout(function() { nextCountry(); }, options.tour.delay);
            }
        });
    }

    globe.zoom2 = function(what, which, zoom) {
        return new Promise(function(resolve, reject) {
            which = which || 'country';
            zoom = zoom == undefined ? false : zoom;
            var coords = [0, 0, 0];
            var scale = options.radius;

            if (!isNaN(what) && what < data.countries.features.length && which == 'country') {
                coords = d3.geoCentroid(data.countries.features[what]).map(function(m) { return -1 * m; });
                changeFocus(undefined);
            } else if (!isNaN(what) && what < data.cities.features.length && which == 'city') {
                coords = d3.geoCentroid(data.cities.features[what]).map(function(m) { return -1 * m; });
                changeFocus(undefined);
            } else if (Object.keys(country_names).indexOf(what) >= 0) {
                coords = d3.geoCentroid(country_names[what]).map(function(m) { return -1 * m; });
                var b = d3.geoBounds(country_names[what]);
                var dx = b[1][0] - b[0][0];
                var dy = b[1][1] - b[0][1];
                var x = (b[0][0] + b[1][0]) / 2;
                var y = (b[0][1] + b[1][1]) / 2;
                bbox = .1 / Math.max(dx / options.width, dy / options.height);
                scale = zoom ? options.radius * bbox : options.radius;
                scale = Math.max(scale, options.radius);
                changeFocus(country_names[what].id);
            } else {
                changeFocus(undefined);
            }

            if (options.zoom.northup && coords.length == 2) coords.push(0);
            globe.coords(coords, scale)
                .then(resolve, reject);
        });
    }

    function interpolatedProjection(a, b, ortho) {
        // var projection = d3.geo.projection(raw).scale(1),
        var projection = d3.geoProjection(raw).scale(1),
            center = projection.center,
            translate = projection.translate,
            clip = projection.clipAngle,
            α;

        function raw(λ, φ) {
            var pa = a([λ *= 180 / Math.PI, φ *= 180 / Math.PI]),
                pb = b([λ, φ]);
            return [(1 - α) * pa[0] + α * pb[0], (α - 1) * pa[1] - α * pb[1]];
        }

        projection.alpha = function(_) {
            if (!arguments.length) return α;
            α = +_;
            var ca = a.center(),
                cb = b.center(),
                ta = a.translate(),
                tb = b.translate();
            center([(1 - α) * ca[0] + α * cb[0], (1 - α) * ca[1] + α * cb[1]]);
            translate([(1 - α) * ta[0] + α * tb[0], (1 - α) * ta[1] + α * tb[1]]);
            if (ortho === true) { clip(180 - α * 90); }
            return projection;
        };

        projection.alpha(0).scale = b.scale;
        delete projection.translate;
        delete projection.center;
        return projection.alpha(0);
    }

    globe.update = function(opts) {
        if (events.update.begin) events.update.begin();
        if (typeof update === 'function') update(opts);
        if (events.update.end) events.update.end();
    }

    // allows updating individual options and suboptions
    // while preserving state of other options
    globe.options = function(values) {
        if (!arguments.length) return options;
        keyWalk(values, options);
        return globe;
    }

    function keyWalk(valuesObject, optionsObject) {
        if (!valuesObject || !optionsObject) return;
        var vKeys = Object.keys(valuesObject);
        var oKeys = Object.keys(optionsObject);
        for (var k = 0; k < vKeys.length; k++) {
            if (oKeys.indexOf(vKeys[k]) >= 0) {
                var oo = optionsObject[vKeys[k]];
                var vo = valuesObject[vKeys[k]];
                if (typeof oo == 'object' && typeof vo !== 'function' && oo.constructor !== Array) {
                    keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
                } else {
                    optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
                }
            }
        }
    }

    globe.events = function(functions) {
        if (!arguments.length) return events;
        keyWalk(functions, events);
        return globe;
    }

    globe.width = function(value) {
        if (!arguments.length) return options.width;
        options.width = value;
        return globe;
    };

    globe.height = function(value) {
        if (!arguments.length) return options.height;
        options.height = value;
        return globe;
    };

    globe.neighbors = function(neighbors) {
        if (!arguments.length) return data.neighbors;
        if (!neighbors || typeof neighbors != 'object' || !neighbors.length) return globe;
        data.neighbors = neighbors;
        return globe;
    }

    function geometryTypes(features) {
        types = [];
        for (element in features) {
            var type = features[element].geometry.type;
            if (types.indexOf(type) < 0) types.push(type);
        }
        return types;
    }

    globe.data = function(new_data) {
        if (!arguments.length) return data;
        if (!new_data || typeof new_data != 'object') return globe;

        if (new_data.type == 'Topology') {
            var countries = topojson.feature(new_data, new_data.objects.countries);
            globe.neighbors(topojson.neighbors(new_data.objects.countries.geometries));
            if (!countries.features) return globe;
            data.countries = countries;
            data.countries.features.forEach(function(c) { country_names[c.properties.name] = c; });
        } else if (new_data.type == 'FeatureCollection') {
            var elements = new_data
            if (!elements.features) return globe;
            var feature_types = geometryTypes(elements.features);
            if (feature_types.indexOf('Polygon') >= 0 || feature_types.indexOf('MultiPolygon') >= 0) {
                data.countries = elements;
                data.countries.features.forEach(function(c) { country_names[c.properties.name] = c; });
            } else if (feature_types.length == 1 && feature_types.indexOf('Point') >= 0) {
                data.cities = elements;
            }
        }
        return globe;
    }

    globe.occasions = function(new_occasions) {
        if (!arguments.length) return data.occasions;
        data.occasions = new_occasions;
        return globe;
    }

    globe.duration = function(time) {
        if (!arguments.length) return options.zoom.time;
        options.zoom.time = time;
        return globe;
    }

    // both graticule fill, outline fill, and a sphere are used in an attempt to
    // maintain consistent background color during transitions...
    globe.oceans = function(color) {
        if (!arguments.length) return options.oceans.fill;
        options.oceans.fill = color;
        options.graticule.fill = color;
        options.graticule.outline.fill = color;
        return globe;
    }

    // set color to 'undefined' to re-enable CSS functionality
    globe.land = function(color) {
        if (!arguments.length) return options.land.fill;
        options.land.fill = color;
        return globe;
    }

    globe.boundaries = function(color) {
        if (!arguments.length) return options.land.stroke;
        options.land.stroke = color;
        return globe;
    }

    globe.cities = function(color) {
        if (!arguments.length) return options.cities.fill;
        options.cities.fill = color;
        options.cities.stroke = color;
        return globe;
    }

    globe.surround = function(color) {
        if (!arguments.length) return options.world.surround;
        options.world.surround = color;
        return globe;
    }

    globe.initialize = function(error, world, cities) {
        if (error) { return error; }

        globe.data(world);
        data.countryData = cities;
        update();
        if (typeof events.ready == 'function') events.ready();
    }

    var spin_timer;
    globe.spin = function(spin) {
        spin = spin == undefined ? true : spin;

        spin_rotation = projection.rotate();
        spin_start = Date.now();
        if (spin) {
            spin_timer = d3.timer(function() {
                var dt = Date.now() - spin_start;
                projection.rotate([spin_rotation[0] + options.world.velocity[0] * dt, spin_rotation[1] + options.world.velocity[1] * dt]);
                reDraw();
            });
        } else if (spin_timer) {
            spin_timer.stop();
            spin_timer = undefined;
        }
    }

    globe.pulse = function() {
        poi.selectAll('.pulse-circle')
            .attr("d", function(d) { return pointPath(d, 0, 0, 0); })
            .style("fill-opacity", 1)
            .transition()
            .delay(function(d, i) { return i * 200; })
            .duration(3000)
            .style("fill-opacity", 0)
            .attrTween("d", function(d) {
                rinterp = d3.interpolate(0, 10);
                var fn = function(t) {
                    d.r = rinterp(t);
                    return pointPath(d, 0, 0, d.r) || 'M0,0';
                };
                return fn;
            });
    }

    globe.flow = function() {
        d3.selectAll('.arcPath')
            .transition()
            .ease('linear')
            .duration(750)
            .attrTween("stroke-dashoffset", function() {
                return d3.interpolate(16, 0);
            })
            .each("end", globe.flow);
    }

    function createStars(number) {
        var data = [];
        for (var i = 0; i < number; i++) {
            data.push({
                geometry: {
                    type: 'Point',
                    coordinates: randomLonLat()
                },
                type: 'Feature',
                properties: {
                    radius: Math.random() * 1.5
                }
            });
        }
        return data;
    }

    function randomLonLat() {
        return [Math.random() * 360 - 180, Math.random() * 180 - 90];
    }

    return globe;
}