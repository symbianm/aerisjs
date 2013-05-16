define(['aeris', 'base/layerstrategy', './mixins/default'], function(aeris) {

  /**
   * @fileoverview Layer manager strategy for support of KML with OpenLayers.
   */


  aeris.provide('aeris.maps.openlayers.layerstrategies.KML');


  /**
   * A strategy for support of KML with OpenLayers.
   *
   * @constructor
   * @extends {aeris.maps.LayerStrategy}
   * @extends {aeris.maps.openlayers.layerstrategies.mixins.Default}
   */
  aeris.maps.openlayers.layerstrategies.KML = function() {
    aeris.maps.LayerStrategy.call(this);
  };
  aeris.inherits(aeris.maps.openlayers.layerstrategies.KML,
                 aeris.maps.LayerStrategy);
  aeris.extend(aeris.maps.openlayers.layerstrategies.KML.prototype,
               aeris.maps.openlayers.layerstrategies.mixins.Default);


  /**
   * @override
   */
  aeris.maps.openlayers.layerstrategies.KML.prototype.createInstanceLayer =
      function(layer) {
    var instanceLayer = new OpenLayers.Layer.Vector(layer.name, {
      strategies: [new OpenLayers.Strategy.Fixed()],
      protocol: new OpenLayers.Protocol.HTTP({
        url: layer.url,
        format: new OpenLayers.Format.KML({
          extractStyles: true,
          extractAttributes: true
        })
      })
    });
    return instanceLayer;
  };


  /**
   * @override
   */
  aeris.maps.openlayers.layerstrategies.KML.prototype.registerInstanceLayer =
      function(instanceLayer, map) {
    aeris.maps.openlayers.layerstrategies.mixins.Default.
        registerInstanceLayer.call(this, instanceLayer, map);
    this.addSelectFeature_(instanceLayer, map);
  };


  /**
   * Allow individual elements in the KML to be selected and alert a pop-up.
   *
   * @param {Object} instanceLayer The instance layer to add the feature to.
   * @param {Object} map The map to register the feature with.
   * @private
   */
  aeris.maps.openlayers.layerstrategies.KML.prototype.addSelectFeature_ =
      function(instanceLayer, map) {
    var select = new OpenLayers.Control.SelectFeature(instanceLayer);
    instanceLayer.events.on({
      'featureselected': this.onFeatureSelect_(select),
      'featureunselected': this.onFeatureUnselect_()
    });
    map.addControl(select);
    select.activate();
  };


  /**
   * Return a callback function that will be called when a KML element is
   * selected.
   *
   * @param {OpenLayers.Control.SelectFeature} select The SelectFeature used
   *     to add the select feature to the KML.
   * @return {Function}
   * @private
   */
  aeris.maps.openlayers.layerstrategies.KML.prototype.onFeatureSelect_ =
      function(select) {
    var self = this;
    function fn(event) {
      var feature = event.feature
      var content = "<h2>" + feature.attributes.name + "</h2>" +
                    feature.attributes.description;
      var popup = new OpenLayers.Popup.FramedCloud('kml-popup',
        feature.geometry.getBounds().getCenterLonLat(),
        new OpenLayers.Size(100, 100),
        content, null, true, self.onPopupClose_(select));
      feature.popup = popup;
      event.feature.layer.map.addPopup(popup);
    };
    return fn;
  };


  /**
   * Return a callback function that will be called when a KML element is
   * unselected.
   *
   * @return {Function}
   * @private
   */
  aeris.maps.openlayers.layerstrategies.KML.prototype.onFeatureUnselect_ =
      function() {
    function fn(event) {
      var feature = event.feature;
      if (feature.popup) {
        feature.layer.map.removePopup(feature.popup);
        feature.popup.destroy();
        feature.popup = null;
      }
    };
    return fn;
  };


  /**
   * Return a callback function that closes all pop-ups for a given
   * SelectFeature.
   *
   * @param {OpenLayers.Control.SelectFeature} select The SelectFeature to have
   *     pop-ups closed.
   * @return {Function}
   * @private
   */
  aeris.maps.openlayers.layerstrategies.KML.prototype.onPopupClose_ =
      function(select) {
    function fn() {
      select.unselectAll();
    };
    return fn;
  };


  return aeris.maps.openlayers.layerstrategies.KML;

});