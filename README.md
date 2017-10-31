This block enters demo mode immediately.  Once complete you can open a javascript console to programatically control the globe using the examples below.

[D3v3 version here](http://bl.ocks.org/TennisVisuals/a21bc8e3cbe9bf7a652daac4ae153ab4)

**Javascript Console**

Open full screen in a new tab, then from the javascript console:

      globe.g2m();
      globe.m2g();
      globe.g2m().then(() => globe.pause(2000)).then(() => globe.m2g())

      globe.zoom2('Russia');
      globe.rotate2().then(() => globe.zoom2('Canada'))
      globe.bounce2('Chile');
      globe.g2m().then(() => globe.zoom2('Indonesia'));
      globe.duration(3000).m2g();
      globe.coords([150, -150, 150]);

      globe.options({graticule: { width: '1px' }}).update();
      globe.oceans('blue').update();
      globe.options({graticule: { width: '0px' }, geodesic: { width: '1px'}}).update();
      globe.options({geodesic: { width: '0px' }}).update();
      globe.reset();

      globe.duration(800).tour();        // or globe.tour(true, true);  // for bouncy tour
      globe.tour(false);   // stop tour

      globe.spin();
      globe.land('black').oceans('black').surround('black').boundaries('black').cities("#ffba00").update();
      worldFile(); // load topo file which includes Topology, but possibly no name ids
      globe.spin(false);
      globe.land('green').oceans('blue').surround('white').boundaries('white').cities('blue').update();

      globe.reset();
      globe.options({display: {cities: false}}).update();  // animation slows down with too many elements
      globe.zoom2('USA');
      globe.scale(200);  // 200% of default
      occasions();
      globe.options({display: {flows: true}}).update();
      globe.options({world: {surround: 'black'}, display: { stars: 300 }}).update();

      globe.pulse();     // starts the animation for occasions
      
**Inspirations**

      1.  http://bl.ocks.org/PatrickStotz/1f19b3e4cb848100ffd7  Placing Cities on map
      2.  http://bl.ocks.org/KoGor/7025316                      Globe to map transitions
      3.  http://bl.ocks.org/KoGor/5994804                      Highlighting Countries
      4.  http://bl.ocks.org/enjalot/31168147b88a1748bc8b       User Location
      5.  https://bl.ocks.org/mbostock/9656675                  Zoom to Bounding Box
      6.  https://www.jasondavies.com/maps/zoom/                Zooming in and out
      7.  http://projectsdemo.net/globe/v4/                     Geodesic
      8.  http://bl.ocks.org/jasondavies/4188334                Coloring Neighbors
      9.  http://stackoverflow.com/questions/10692100/invoke-a-callback-at-the-end-of-a-transition
      10. https://anthonyskelton.com/2016/d3-js-earthquake-visualizations/



forked from <a href='http://bl.ocks.org/TennisVisuals/'>TennisVisuals</a>'s block: <a href='http://bl.ocks.org/TennisVisuals/a21bc8e3cbe9bf7a652daac4ae153ab4'>reusable updateable global mashup</a>

forked from <a href='http://bl.ocks.org/TennisVisuals/'>TennisVisuals</a>'s block: <a href='http://bl.ocks.org/TennisVisuals/126c07d1aa746aa4de1f711b7661fad9'>d3v4 reusable updateable global mashup</a>

forked from <a href='http://bl.ocks.org/anonymous/'>anonymous</a>'s block: <a href='http://bl.ocks.org/anonymous/6fafb8d71f20dd7c75c8dec12dfbc1eb'>d3v4 reusable updateable global mashup</a>