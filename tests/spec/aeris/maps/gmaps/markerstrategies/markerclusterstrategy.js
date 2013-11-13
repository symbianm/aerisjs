define([
  'aeris/util',
  'gmaps/markerstrategies/markerclusterstrategy',
  'aeris/collection',
  'aeris/model'
], function(_, MarkerClusterStrategy, Collection, Model) {

  var MockMarkerClustererFactory = function() {
    var MockMarkerClusterer = jasmine.createSpy('MarkerClusterer ctor');
    MockMarkerClusterer.prototype.addMarker = jasmine.createSpy('MarkerClusterer#addMarker');
    MockMarkerClusterer.prototype.setMap = jasmine.createSpy('MarkerClusterer#setMap');
    MockMarkerClusterer.prototype.clearMarkers = jasmine.createSpy('MarkerClusterer#clearMarkers');

    return MockMarkerClusterer;
  };



  var MockMarker = function() {
    this.getView = jasmine.createSpy('Marker#getView').
      andReturn(_.uniqueId('MarkerView_'));

    Model.apply(this, arguments);
  };
  _.inherits(MockMarker, Model);


  var MockObject = function(opt_models, opt_options) {
    var options = _.defaults(opt_options || {}, {
      map: new MockMap(),
      clusterBy: 'data.report.type',
      model: MockMarker
    });

    this.hasMap = jasmine.createSpy('hasMap').
      andReturn(!!options.map);

    this.getMap = jasmine.createSpy('getMap').
      andReturn(options.map);

    this.getClusterBy = jasmine.createSpy('getClusterBy').
      andReturn(options.clusterBy);

    // Cans to return { icon: 'GROUPNAME_ICON' }
    this.getClusterStyles = jasmine.createSpy('getClusterStyles').
      andCallFake(function(groupName) {
        return { url: groupName.toUpperCase() + '_ICON' };
      });

    Collection.call(this, opt_models, options);
  };
  _.inherits(MockObject, Collection);



  var MockMap = function() {
    this.getView = jasmine.createSpy('Map#getView').
      andReturn(_.uniqueId('MapView_'));

    Model.apply(this, arguments);
  };
  _.inherits(MockMap, Model);




  describe('A MarkerClustererStrategy', function() {

    describe('constructor', function() {

      describe('createView', function() {

        it('should add all of the object\'s markers', function() {
          var obj = new MockObject([
            { data: { report: { type: 'rain' } } },
            { data: { report: { type: 'snow' } } },
            { data: { report: { type: 'rain' } } },
            { data: { report: { type: 'fog' } } }
          ]);

          spyOn(MarkerClusterStrategy.prototype, 'addMarkers');

          new MarkerClusterStrategy(obj, { MarkerClusterer: MockMarkerClustererFactory() });

          expect(MarkerClusterStrategy.prototype.addMarkers).toHaveBeenCalledWith(obj.models);
        });

      });


      describe('Event binding', function() {
        var obj, strategy;

        beforeEach(function() {
          obj = new MockObject();
          strategy = new MarkerClusterStrategy(obj, {
            MarkerClusterer: MockMarkerClustererFactory()
          });
        });

        it('should add a marker added to the object', function() {
          var marker = new MockMarker();

          spyOn(strategy, 'addMarker');

          obj.trigger('add', marker, obj, { some: 'opts' });
          expect(strategy.addMarker).toHaveBeenCalledWith(marker);
        });

        it('should remove a marker removed from the object', function() {
          var marker = new MockMarker();

          spyOn(strategy, 'removeMarker');

          obj.trigger('remove', marker, obj, { some: 'opts' });
          expect(strategy.removeMarker).toHaveBeenCalledWith(marker);
        });

        it('should reset the MarkerClusterers, if the object is reset', function() {
          spyOn(strategy, 'resetClusters');

          obj.trigger('reset', obj, { some: 'opts' });
          expect(strategy.resetClusters).toHaveBeenCalled();
        });

        it('should reset the MarkerClusterers if the object\'s \'clusterBy\' option changes', function() {
          spyOn(strategy, 'resetClusters');

          obj.trigger('change:clusterBy', obj, 'some.new.path', { some: 'opts' });
          expect(strategy.resetClusters).toHaveBeenCalled();
        });

        it('should repaint clusters when marker properties change', function() {
          spyOn(strategy, 'repaint');

          obj.trigger('change', new MockMarker(), { some: 'opts' });
          expect(strategy.repaint).toHaveBeenCalled();
        });

        // Not sure how to test these...
        /*it('should trigger a click event on the object when a marker cluster is clicked', function() {
        });

        it('should trigger a mouseover event on the object when a markercluster is mouse-over\'d', function() {
        });

        it('should trigger a mouseout event on the object when a markercluster is mouse-out\'d', function() {
        });*/

      })

    });

    describe('addMarker', function() {

      it('should add the marker to its group\'s clusterer, creating a new clusterer if necessary', function() {
        var obj = new MockObject();
        var MarkerClusterer = MockMarkerClustererFactory();
        var markers = [
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } })
        ];
        var strategy = new MarkerClusterStrategy(obj, { MarkerClusterer: MarkerClusterer });

        // Add a marker with a new group
        // --> Create a MarkerClusterer for the group
        strategy.addMarker(markers[0]);
        expect(MarkerClusterer).toHaveBeenCalledWith(
          obj.getMap().getView(),
          [],
          {
            styles: { url: 'SNOW_ICON' }
          }
        );
        expect(strategy.getView().snow).toBeInstanceOf(MarkerClusterer);
        expect(MarkerClusterer.prototype.addMarker).toHaveBeenCalledWith(markers[0].getView());

        // Add another of the same type
        // --> Should NOT create another MarkerClusterer instance
        strategy.addMarker(markers[1]);
        expect(MarkerClusterer.callCount).toEqual(1);
        expect(MarkerClusterer.prototype.addMarker).toHaveBeenCalledWith(markers[1].getView());
        expect(strategy.getView().snow).toBeInstanceOf(MarkerClusterer);

        // Add another of a different type
        // --> Should create another MarkerClusterer instance
        strategy.addMarker(markers[2]);
        expect(MarkerClusterer.callCount).toEqual(2);
        expect(MarkerClusterer.prototype.addMarker).toHaveBeenCalledWith(markers[2].getView());
        expect(strategy.getView().rain).toBeInstanceOf(MarkerClusterer);
        expect(strategy.getView().snow).toBeInstanceOf(MarkerClusterer);
      });

      it('should trigger \'clusterer:create\' \'clusterer:add\' events', function() {
        var obj = new MockObject();
        var markers = [
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } })
        ];
        var strategy = new MarkerClusterStrategy(obj, {
          MarkerClusterer: MockMarkerClustererFactory()
        });
        var listeners = jasmine.createSpyObj('evtListener', ['add', 'create']);

        strategy.on({
          'clusterer:create': listeners.create,
          'clusterer:add': listeners.add
        });

        _.each(markers, strategy.addMarker, strategy);

        expect(listeners.create).toHaveBeenCalledWith(strategy.getClusterer('snow'));
        expect(listeners.create).toHaveBeenCalledWith(strategy.getClusterer('rain'));

        expect(listeners.add).toHaveBeenCalledWith(strategy.getClusterer('snow'), 'snow');
        expect(listeners.add).toHaveBeenCalledWith(strategy.getClusterer('rain'), 'rain');
      });

      it('should use a single MarkerClusterer, if no clusterBy option is defined', function() {
        var obj = new MockObject(undefined, { clusterBy: null });
        var MarkerClusterer = MockMarkerClustererFactory();
        var strategy = new MarkerClusterStrategy(obj, { MarkerClusterer: MarkerClusterer });
        var singleClusterer;

        var markers = [
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'hail' } } })
        ];

        // Add all of the markers
        _.each(markers, strategy.addMarker, strategy);

        // Only one MarkerClusterer instance should have been created.
        expect(MarkerClusterer.callCount).toEqual(1);

        // The view should only reference a single group
        singleClusterer = strategy.getClusterer(MarkerClusterStrategy.SINGLE_CLUSTER_GROUPNAME);
        expect(singleClusterer).toBeInstanceOf(MarkerClusterer);
        expect(_(strategy.getView()).keys().length).toEqual(1);

        // All of the markers should have been added
        expect(singleClusterer.addMarker).toHaveBeenCalledWith(markers[0].getView());
        expect(singleClusterer.addMarker).toHaveBeenCalledWith(markers[1].getView());
        expect(singleClusterer.addMarker).toHaveBeenCalledWith(markers[2].getView());
        expect(singleClusterer.addMarker).toHaveBeenCalledWith(markers[3].getView());
        expect(singleClusterer.addMarker.callCount).toEqual(4);
      });

    });


    describe('setMap', function() {

      it('should set the specified map on all MarkerClusterer objects', function() {
        var obj = new MockObject();
        var strategy = new MarkerClusterStrategy(obj, {
          MarkerClusterer: MockMarkerClustererFactory()
        });
        var newMap = new MockMap();

        strategy.addMarkers([
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'hail' } } })
        ]);

        // Spy on MarkerClusterer#setMap
        strategy.getClusterer('snow').setMap = jasmine.createSpy('setMap-snow');
        strategy.getClusterer('rain').setMap = jasmine.createSpy('setMap-rain');
        strategy.getClusterer('hail').setMap = jasmine.createSpy('setMap-hail');

        strategy.setMap(newMap);
        expect(strategy.getClusterer('snow').setMap).toHaveBeenCalledWith(newMap.getView());
        expect(strategy.getClusterer('rain').setMap).toHaveBeenCalledWith(newMap.getView());
        expect(strategy.getClusterer('hail').setMap).toHaveBeenCalledWith(newMap.getView());
      });

    });


    describe('remove', function() {

      it('should set all MarkerClusterer objects\' maps to  null', function() {
        var obj = new MockObject();
        var strategy = new MarkerClusterStrategy(obj, {
          MarkerClusterer: MockMarkerClustererFactory()
        });

        strategy.addMarkers([
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'hail' } } })
        ]);

        // Spy on MarkerClusterer#setMap
        strategy.getClusterer('snow').setMap = jasmine.createSpy('setMap-snow');
        strategy.getClusterer('rain').setMap = jasmine.createSpy('setMap-rain');
        strategy.getClusterer('hail').setMap = jasmine.createSpy('setMap-hail');

        strategy.remove();
        expect(strategy.getClusterer('snow').setMap).toHaveBeenCalledWith(null);
        expect(strategy.getClusterer('rain').setMap).toHaveBeenCalledWith(null);
        expect(strategy.getClusterer('hail').setMap).toHaveBeenCalledWith(null);
      });

    });


    describe('addMarkers', function() {

      it('should add all the markers in the array', function() {
        var obj = new MockObject();
        var strategy = new MarkerClusterStrategy(obj, { MarkerClusterer: MockMarkerClustererFactory() });
        var markers = ['marker_0', 'marker_1', 'marker_2'];

        spyOn(strategy, 'addMarker');

        strategy.addMarkers(markers);

        expect(strategy.addMarker.callCount).toEqual(3);
        expect(strategy.addMarker).toHaveBeenCalledInTheContextOf(strategy);
        expect(strategy.addMarker.argsForCall[0][0]).toEqual(markers[0]);
        expect(strategy.addMarker.argsForCall[1][0]).toEqual(markers[1]);
        expect(strategy.addMarker.argsForCall[2][0]).toEqual(markers[2]);
      });

    });


    describe('removeMarker', function() {
      it('should remove a marker from the matching clusterer', function() {
        var strategy = new MarkerClusterStrategy(new MockObject(), { 
          MarkerClusterer: MockMarkerClustererFactory() 
        });
        var markers = [
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } })
        ];

        strategy.addMarkers(markers);

        strategy.getClusterer('rain').removeMarker = jasmine.createSpy('removeRainMarker');
        strategy.getClusterer('snow').removeMarker = jasmine.createSpy('removeSnowMarker');

        strategy.removeMarker(markers[0]);
        expect(strategy.getClusterer('rain').removeMarker).toHaveBeenCalledWith(markers[0].getView());

        strategy.removeMarker(markers[1]);
        expect(strategy.getClusterer('rain').removeMarker).toHaveBeenCalledWith(markers[1].getView());

        strategy.removeMarker(markers[2]);
        expect(strategy.getClusterer('snow').removeMarker).toHaveBeenCalledWith(markers[2].getView());
      });
    });


    describe('clearClusters', function() {
      it ('should clear markers from all clusterer objects', function() {
        var strategy = new MarkerClusterStrategy(new MockObject(), {
          MarkerClusterer: MockMarkerClustererFactory()
        });
        var markers = [
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } })
        ];
        var rainClusterer, snowClusterer;

        strategy.addMarkers(markers);

        rainClusterer = strategy.getClusterer('rain');
        snowClusterer = strategy.getClusterer('snow');

        rainClusterer.clearMarkers = jasmine.createSpy('clearMarkers_rain');
        snowClusterer.clearMarkers = jasmine.createSpy('clearMarkers_snow');

        strategy.clearClusters();
        expect(rainClusterer.clearMarkers).toHaveBeenCalled();
        expect(snowClusterer.clearMarkers).toHaveBeenCalled();

        // Should clean up view object
        expect(_(strategy.getView()).keys().length).toEqual(0);
      });

      it('should trigger a \'clusterer:remove\' event for each clusterer', function() {
        var strategy = new MarkerClusterStrategy(new MockObject(), {
          MarkerClusterer: MockMarkerClustererFactory()
        });
        var markers = [
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } })
        ];
        var rainClusterer, snowClusterer;
        var removeListener = jasmine.createSpy('removeListener');

        strategy.addMarkers(markers);

        rainClusterer = strategy.getClusterer('rain');
        snowClusterer = strategy.getClusterer('snow');

        // Bind listeners (spies)
        strategy.on('clusterer:remove', removeListener);

        strategy.clearClusters();
        expect(removeListener).toHaveBeenCalledWith(rainClusterer, 'rain');
        expect(removeListener).toHaveBeenCalledWith(snowClusterer, 'snow');
      });
    });


    describe('resetClusters', function() {

      it('should remove and re-add all markers', function() {
        var obj = new MockObject([
          { data: { report: { type: 'rain' } } },
          { data: { report: { type: 'snow' } } },
          { data: { report: { type: 'rain' } } },
          { data: { report: { type: 'fog' } } }
        ]);
        var strategy = new MarkerClusterStrategy(obj, {
          MarkerClusterer: MockMarkerClustererFactory()
        });

        spyOn(strategy, 'clearClusters');
        spyOn(strategy, 'addMarkers');

        strategy.resetClusters();

        expect(strategy.clearClusters).toHaveBeenCalled();
        expect(strategy.addMarkers).toHaveBeenCalledWith(obj.models);
      });

    });


    describe('repaint', function() {

      it('should repaint all MarkerClusterer objects', function() {
        var obj = new MockObject();
        var strategy = new MarkerClusterStrategy(obj, {
          MarkerClusterer: MockMarkerClustererFactory()
        });

        strategy.addMarkers([
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'snow' } } }),
          new MockMarker({ data: { report: { type: 'rain' } } }),
          new MockMarker({ data: { report: { type: 'hail' } } })
        ]);

        // Spy on MarkerClusterer#repaint
        strategy.getClusterer('snow').repaint = jasmine.createSpy('repaint-snow');
        strategy.getClusterer('rain').repaint = jasmine.createSpy('repaint-rain');
        strategy.getClusterer('hail').repaint = jasmine.createSpy('repaint-hail');

        strategy.repaint();
        expect(strategy.getClusterer('snow').repaint).toHaveBeenCalled();
        expect(strategy.getClusterer('rain').repaint).toHaveBeenCalled();
        expect(strategy.getClusterer('hail').repaint).toHaveBeenCalled();
      });

    });


    describe('destroy', function() {

      it('should clear clusters', function() {
        var obj = new MockObject();
        var strategy = new MarkerClusterStrategy(obj, {
          MarkerClusterer: MockMarkerClustererFactory()
        });

        spyOn(strategy, 'clearClusters');

        strategy.destroy();
        expect(strategy.clearClusters).toHaveBeenCalled();
      });

    });

  });

});