({
  name: 'aeris/builder/maps/mapappbuilder',
  out: '../../../build/cdn.aerisjs.com/mapapp.js',

  mainConfigFile: '../../../config-amd.js',
  baseUrl: '../../../',

  paths: {
    'aeris/maps/strategy': 'src/maps/gmaps'
  },

  optimize: 'none',
  preserveLicenseComments: false,

  // Handlebars config
  inlineText: true,
  stubModules: ['text', 'hbars'],
  // Use handlebars runtime script
  onBuildWrite : function(moduleName, path, content){
    // replace handlebars with the runtime version
    if (moduleName === 'Handlebars') {
      path = path.replace('handlebars.js','handlebars.runtime.js');
      content = fs.readFileSync(path).toString();
      content = content.replace(/(define\()(function)/, '$1"handlebars", $2');
    }
    return content;
  },

  include: [
    'aeris/packages/maps',
    'aeris/packages/gmaps'
  ],
  wrap: {
    startFile: [
      '../../frag/wrap/start.frag.js',
      '../../../bower_components/requirejs/require.js'
    ],
    endFile: [
      '../../frag/facade/mapapp.frag.js',
      '../../frag/wrap/end.frag.js'
    ]
  }
})