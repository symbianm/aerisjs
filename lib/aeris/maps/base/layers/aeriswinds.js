define(['aeris', './aerisinteractivetile'], function(aeris) {

  /**
   * @fileoverview Representation of Aeris Winds layer.
   */

  aeris.provide('aeris.maps.layers.AerisWinds');


  /**
   * @constructor
   * @extends {aeris.maps.layers.AerisInteractiveTile}
   */
  aeris.maps.layers.AerisWinds = function() {

    // Call parent constructor
    aeris.maps.layers.AerisInteractiveTile.call(this);

    /**
     * @override
     */
    this.name = 'AerisWinds';

    /**
     * @override
     */
    this.tileType = 'current_winds';


    this.autoUpdateInterval = this.updateIntervals.CURRENT;

  };

  // Inherit from AerisInteractiveTile
  aeris.inherits(aeris.maps.layers.AerisWinds,
                 aeris.maps.layers.AerisInteractiveTile
  );


  return aeris.maps.layers.AerisWinds;
});