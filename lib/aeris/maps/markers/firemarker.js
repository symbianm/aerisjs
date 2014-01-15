define([
  'ai/util',
  'ai/config',
  'ai/maps/markers/pointdatamarker'
], function(_, config, PointDataMarker) {
  /**
   * @class aeris.maps.markers.FireMarker
   * @extends aeris.maps.markers.PointDataMarker
   * @constructor
   */
  var FireMarker = function(opt_attrs, opt_options) {
    var attrs = _.extend({
      url: config.get('path') + 'assets/map_fire_marker.png'
    }, opt_attrs);

    PointDataMarker.call(this, attrs, opt_options);
  };
  _.inherits(FireMarker, PointDataMarker);


  /**
   * @override
   */
  FireMarker.prototype.lookupTitle_ = function() {
    var cause = this.getDataAttribute('report.cause');

    return cause ? 'Fire caused by ' + cause : 'Fire';
  };


  return FireMarker;
});