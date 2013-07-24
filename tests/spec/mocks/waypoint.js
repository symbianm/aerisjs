define(['gmaps/route/waypoint', 'underscore'], function(Waypoint, _) {
  // Random float between
  function randomFloatBetween(minValue, maxValue, precision) {
    precision || (precision = 2);
    return parseFloat(Math.min(minValue + (Math.random() * (maxValue - minValue)), maxValue).toFixed(precision));
  }

  function getRandomLatLon(from, to) {
    var precision = 5;

    from || (from = [39, -91]);
    to || (to = [41, -89]);

    return [
      randomFloatBetween(from[0], to[0]),
      randomFloatBetween(from[1], to[1])
    ];
  }

  /**
   * @param {Object} opt_options
   * @param {aeris.maps.gmaps.route.Waypoint|MockWaypoint} opt_options.previous
   * @param {Number} opt_options.distance
   * @param {Boolean} isFirst If this is the first waypoint, will not provide a path.
   * @constructor
   */
  return function MockWaypoint(opt_options, isFirst) {
    var wpOptions;

    opt_options || (opt_options = {});
    isFirst || (isFirst = false);

    wpOptions = _.extend({
      previous: opt_options.previous || null,
      distance: opt_options.distance || null,
      path: isFirst ? null : [
        getRandomLatLon(),
        getRandomLatLon(),
        getRandomLatLon()
      ],
      originalLatLon: getRandomLatLon(),
      geocodedLatLon: getRandomLatLon()
    }, opt_options);

    return new Waypoint(wpOptions);
  }
});