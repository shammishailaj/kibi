import _ from 'lodash';

import 'plugins/kibana/management/sections';
import 'plugins/kibana/management/styles/main.less';
import 'ui/filters/start_from';
import 'ui/field_editor';
import 'plugins/kibana/management/sections/indices/_indexed_fields';
import 'plugins/kibana/management/sections/indices/_scripted_fields';
import 'plugins/kibana/management/sections/indices/source_filters/source_filters';
import 'ui/directives/bread_crumbs';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import appTemplate from 'plugins/kibana/management/app.html';
import landingTemplate from 'plugins/kibana/management/landing.html';
import chrome from 'ui/chrome/chrome';
import management from 'ui/management';
import 'ui/kbn_top_nav';

uiRoutes
.when('/management', {
  template: landingTemplate
});

require('ui/index_patterns/route_setup/load_default')({
  whenMissingRedirectTo: '/management/siren/index'
});

uiModules
.get('apps/management')
.directive('kbnManagementApp', function (Private, $route, $location, timefilter, buildNum, buildSha,
  kibiVersion, kibiKibanaAnnouncement) {
  return {
    restrict: 'E',
    template: appTemplate,
    transclude: true,
    scope: {
      sectionName: '@section'
    },

    link: function ($scope) {
      timefilter.enabled = false;
      $scope.sections = management.items.inOrder;
      $scope.section = management.getSection($scope.sectionName) || management;

      if ($scope.section) {
        $scope.section.items.forEach(item => {
          item.active = `#${$location.path()}`.indexOf(item.url) > -1;
        });
      }

      // siren: about section improved
      management.getSection('kibana').info = {
        kibiVersion: kibiVersion,
        kibiKibanaAnnouncement: kibiKibanaAnnouncement,
        build: buildNum,
        sha: buildSha,
        currentYear: new Date().getFullYear()
      };

    }
  };
});

uiModules
.get('apps/management')
.directive('kbnManagementLanding', function (kbnVersion) {
  return {
    restrict: 'E',
    link: function ($scope) {
      $scope.sections = management.items.inOrder;
      $scope.kbnVersion = kbnVersion;
    }
  };
});