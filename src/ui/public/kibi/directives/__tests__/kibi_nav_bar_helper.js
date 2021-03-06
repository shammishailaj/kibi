import * as onPage from 'ui/kibi/utils/on_page';
import { KibiNavBarHelperFactory } from 'ui/kibi/directives/kibi_nav_bar_helper';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import { mockSavedObjects } from 'fixtures/kibi/mock_saved_objects';
import _ from 'lodash';
import chrome from 'ui/chrome';
import noDigestPromises from 'test_utils/no_digest_promises';
import Promise from 'bluebird';

describe('Kibi Directives', function () {
  describe('KibiNavBar Helper', function () {
    let kibiState;
    let globalState;
    let kibiNavBarHelper;
    let $rootScope;
    let dashboardGroups;
    let timeBasedIndicesStub;
    let getDashboardsMetadataStub;
    let getBashPathStub;
    let onDashboardPageStub;

    noDigestPromises.activateForSuite();

    function getDefaultQuery() {
      return {
        query_string: {
          query: '*',
          analyze_wildcard: true
        }
      };
    }

    function init({ savedDashboards = [], groups = [] }) {
      ngMock.module('kibana', ($provide) => {
        $provide.service('$timeout', () => {
          const mockTimeout = fn => Promise.resolve(fn());
          mockTimeout.cancel = _.noop;
          return mockTimeout;
        });
        $provide.service('timefilter', () => {
          const timefilter = {
            refreshInterval: {
              display: '5 seconds',
              pause: false
            }
          };
          return timefilter;
        });
        $provide.service('joinExplanation', () => {
          return {
            constructFilterIconMessage: (filters, queries) => {
              if (filters && filters.length === 1 && filters[0].filter) {
                return Promise.resolve(filters[0].filter);
              } else {
                return Promise.resolve(null);
              }
            }
          };
        });
        $provide.constant('kbnDefaultAppId', '');
      });

      ngMock.module('app/dashboard', function ($provide) {
        $provide.service('savedDashboards', (Promise, Private) => mockSavedObjects(Promise, Private)('savedDashboards', savedDashboards));
      });

      ngMock.module('app/discover', function ($provide) {
        $provide.service('savedSearches', (Promise, Private) => mockSavedObjects(Promise, Private)('savedSearches', []));
      });

      ngMock.inject(function (_dashboardGroups_, _globalState_, _kibiState_, _$rootScope_, Private) {
        globalState = _globalState_;
        kibiState = _kibiState_;
        $rootScope = _$rootScope_;
        kibiNavBarHelper = Private(KibiNavBarHelperFactory);
        sinon.stub(kibiState, '_getCurrentDashboardId').returns('dashboard1');
        timeBasedIndicesStub = sinon.stub(kibiState, 'timeBasedIndices').returns(Promise.resolve([ 'id' ]));

        getBashPathStub = sinon.stub(chrome, 'getBasePath').returns('');
        onDashboardPageStub = sinon.stub(onPage, 'onDashboardPage').returns(true);

        dashboardGroups = _dashboardGroups_;
        sinon.stub(dashboardGroups, 'getGroups').returns(groups);
        getDashboardsMetadataStub = sinon.stub(dashboardGroups, '_getDashboardsMetadata');
      });
    }

    afterEach(function () {
      getBashPathStub.restore();
      onDashboardPageStub.restore();
    });

    describe('remove dashboards properties (count, isPruned, filterIconMessage)', function () {

      beforeEach(() => {
        const dash1 = {
          id: 'dashboard1',
          title: 'dashboard1',
          savedSearchId: 'search1',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index1',
                filter: []
              }
            )
          },
          count: 789,
          isPruned: true,
          filterIconMessage: 'there is so many filters :('
        };
        const dash2 = {
          id: 'dashboard2',
          title: 'dashboard2',
          savedSearchId: 'search2',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index2',
                filter: []
              }
            )
          },
          count: 123,
          isPruned: false,
          filterIconMessage: 'there is 1 filter'
        };

        init({
          savedDashboards: [dash1, dash2],
          groups: [
            {
              id: 'group dashboard1',
              selected: dash1,
              dashboards: [dash1]
            },
            {
              id: 'group dashboard2',
              selected: dash2,
              dashboards: [dash2]
            }
          ]
        });
      });

      it('should set count, isPruned and filterIconMessage to undefined if there is no metadata for the requested dashboard', function () {
        // return meta only for second dashboard
        getDashboardsMetadataStub.returns(Promise.resolve([
          {
            dashboardId: 'dashboard2',
            count: 24,
            queries: [ getDefaultQuery() ],
            filters: [{ filter: 'dash2query' }],
            isPruned: true
          }
        ]));

        return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
        .then(() => {
          expect(dashboardGroups.getGroups()).to.have.length(2);
          expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
          expect(dashboardGroups.getGroups()[0].selected.count).to.not.be.ok();
          expect(dashboardGroups.getGroups()[0].selected.filterIconMessage).to.not.be.ok();
          expect(dashboardGroups.getGroups()[0].selected.isPruned).to.not.be.ok();
          expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
          expect(dashboardGroups.getGroups()[1].selected.count).to.equal(24);
          expect(dashboardGroups.getGroups()[1].selected.isPruned).to.equal(true);
          expect(dashboardGroups.getGroups()[1].selected.filterIconMessage).to.equal('dash2query');
        });
      });
    });

    describe('set dashboards properties (count, isPruned, filterIconMessage)', function () {
      beforeEach(() => {
        const dash1 = {
          id: 'dashboard1',
          title: 'dashboard1',
          savedSearchId: 'search1',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index1',
                filter: []
              }
            )
          }
        };
        const dash2 = {
          id: 'dashboard2',
          title: 'dashboard2',
          savedSearchId: 'search2',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index2',
                filter: []
              }
            )
          }
        };

        init({
          savedDashboards: [dash1, dash2],
          groups: [
            {
              id: 'group dashboard1',
              selected: dash1,
              dashboards: [dash1]
            },
            {
              id: 'group dashboard2',
              selected: dash2,
              dashboards: [dash2]
            }
          ]
        });
      });

      describe('should update filterIconMessage on selected dashboards', function () {

        it('there should be filterIconMessage just for first dashboard when filter is set on it', function () {
          getDashboardsMetadataStub.returns(Promise.resolve([
            {
              dashboardId: 'dashboard1',
              count: 42,
              queries: [ getDefaultQuery() ],
              filters: [{ filter: 'dash1query' }],
              isPruned: false
            },
            {
              dashboardId: 'dashboard2',
              count: 24,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            }
          ]));

          return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
          .then(() => {
            expect(dashboardGroups.getGroups()).to.have.length(2);
            expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
            expect(dashboardGroups.getGroups()[0].selected.filterIconMessage).to.be('dash1query');
            expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
            expect(dashboardGroups.getGroups()[1].selected.filterIconMessage).to.be(null);
          });
        });

        it('there should be filterIconMessage just for first dashboard when 2 filters are set on it', function () {
          getDashboardsMetadataStub.returns(Promise.resolve([
            {
              dashboardId: 'dashboard1',
              count: 42,
              queries: [ getDefaultQuery() ],
              filters: [{ filter: '2filtersDash1Message' }],
              isPruned: false
            },
            {
              dashboardId: 'dashboard2',
              count: 24,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            }
          ]));

          return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
          .then(() => {
            expect(dashboardGroups.getGroups()).to.have.length(2);
            expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
            expect(dashboardGroups.getGroups()[0].selected.filterIconMessage).to.be('2filtersDash1Message');
            expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
            expect(dashboardGroups.getGroups()[1].selected.filterIconMessage).to.be(null);
          });
        });

        it('there should be filterIconMessage just for first dashboard when there are two queries for it', function () {
          getDashboardsMetadataStub.returns(Promise.resolve([
            {
              dashboardId: 'dashboard1',
              count: 42,
              queries: [{ query: 'saved_with_dash' }, { query: 'set_on_search_bar' }],
              filters: [{ filter: '2queryDash1Message' }],
              isPruned: false
            },
            {
              dashboardId: 'dashboard2',
              count: 24,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            }
          ]));

          return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
          .then(() => {
            expect(dashboardGroups.getGroups()).to.have.length(2);
            expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
            expect(dashboardGroups.getGroups()[0].selected.filterIconMessage).to.be('2queryDash1Message');
            expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
            expect(dashboardGroups.getGroups()[1].selected.filterIconMessage).to.be(null);
          });
        });

        it('there should be filterIconMessage just for first dashboard when there are two queries and a filter', function () {
          getDashboardsMetadataStub.returns(Promise.resolve([
            {
              dashboardId: 'dashboard1',
              count: 42,
              queries: [{ query: 'saved_with_dash' }, { query: 'set_on_search_bar' }],
              filters: [{ filter: '1query2filtersDash1Message' }],
              isPruned: false
            },
            {
              dashboardId: 'dashboard2',
              count: 24,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            }
          ]));

          return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
          .then(() => {
            expect(dashboardGroups.getGroups()).to.have.length(2);
            expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
            expect(dashboardGroups.getGroups()[0].selected.filterIconMessage).to.be('1query2filtersDash1Message');
            expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
            expect(dashboardGroups.getGroups()[1].selected.filterIconMessage).to.be(null);
          });
        });
      });

      describe('should update counts on selected dashboards', function () {

        it('for all dashboards', function () {
          getDashboardsMetadataStub.returns(Promise.resolve([
            {
              dashboardId: 'dashboard1',
              count: 42,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            },
            {
              dashboardId: 'dashboard2',
              count: 24,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            }
          ]));

          return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
          .then(() => {
            expect(dashboardGroups.getGroups()).to.have.length(2);
            expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
            expect(dashboardGroups.getGroups()[0].selected.count).to.be(42);
            expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
            expect(dashboardGroups.getGroups()[1].selected.count).to.be(24);
          });
        });

        it('for one dashboard', function () {
          getDashboardsMetadataStub.returns(Promise.resolve([
            {
              dashboardId: 'dashboard1',
              count: 42,
              queries: [ getDefaultQuery() ],
              filters: [],
              isPruned: false
            }
          ]));

          return kibiNavBarHelper.updateAllCounts([ 'dashboard1' ])
          .then(() => {
            expect(dashboardGroups.getGroups()).to.have.length(2);
            expect(dashboardGroups.getGroups()[0].id).to.be('group dashboard1');
            expect(dashboardGroups.getGroups()[0].selected.count).to.be(42);
            expect(dashboardGroups.getGroups()[1].id).to.be('group dashboard2');
            expect(dashboardGroups.getGroups()[1].selected.count).to.not.be.ok();
          });
        });
      });

      it('should update counts of current dashboard on kibiState changes', function (done) {
        const stub = sinon.stub(kibiNavBarHelper, 'updateAllCounts');
        let counter = 0;
        kibiState.on('save_with_changes', function (diff) {
          counter++;
          if (diff[0] === kibiState._properties.groups) {
            expect(stub.calledWith([ 'dashboard1' ], `KibiState change ${JSON.stringify([ 'g' ], null, ' ')}`)).to.be(true);
          }
          if (counter === 1) {
            done();
          }
        });

        kibiState.emit('save_with_changes', [  kibiState._properties.groups ]);
      });

      it('should update counts of dashboards that got changed on kibiState reset', function (done) {
        const stub = sinon.stub(kibiNavBarHelper, 'updateAllCounts');
        kibiState.on('reset', function (diff) {
          if (diff[0] === 'dashboard2') {
            expect(stub.calledWith([ 'dashboard2' ], 'KibiState reset')).to.be(true);
            done();
          }
        });

        kibiState.emit('reset', [ 'dashboard2' ]);
      });

      it('should update the count of dashboard that got changed on kibiState time event', function (done) {
        const stub = sinon.stub(kibiNavBarHelper, 'updateAllCounts');
        kibiState.on('time', function (dashboardId) {
          expect(stub.calledWith([ 'dashboard2' ], 'KibiState time changed on dashboard dashboard2')).to.be(true);
          done();
        });

        kibiState.emit('time', 'dashboard2');
      });

      it('should update all counts on globalState filters changes', function (done) {
        const stub = sinon.stub(kibiNavBarHelper, 'updateAllCounts');
        globalState.on('save_with_changes', function (diff) {
          if (diff[0] === 'filters') {
            expect(stub.calledWith(null, 'GlobalState pinned filters change')).to.be(true);
            done();
          }
        });

        globalState.emit('save_with_changes', [ 'filters' ]);
      });

      it('should update all counts on globalState time refreshInterval changes', function (done) {
        const stub = sinon.stub(kibiNavBarHelper, 'updateAllCounts');
        globalState.on('save_with_changes', function (diff) {
          if (diff[0] === 'refreshInterval') {
            expect(stub.calledWith(null, 'GlobalState refreshInterval changed')).to.be(true);
            done();
          }
        });

        globalState.emit('save_with_changes', [ 'refreshInterval' ]);
      });

      it('should update count of current dashboard on globalState time change', function (done) {
        const stub = sinon.stub(kibiNavBarHelper, 'updateAllCounts');
        globalState.on('save_with_changes', function (diff) {
          if (diff[0] === 'time') {
            expect(stub.calledWith([ 'dashboard1' ], 'GlobalState time changed')).to.be(true);
            done();
          }
        });

        globalState.emit('save_with_changes', [ 'time' ]);
      });
    });

    describe('groups with no queries and unvisible dashboards', function () {

      beforeEach(function () {
        const dash1 = {
          id: 'dashboard1',
          title: 'dashboard1',
          savedSearchId: 'search1',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index1',
                filter: []
              }
            )
          }
        };
        const dash2 = {
          id: 'dashboard2',
          title: 'dashboard2',
          savedSearchId: 'search2',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index2',
                filter: []
              }
            )
          }
        };
        const dash3 = {
          id: 'invisibledashboard3',
          title: 'dashboard3',
          savedSearchId: 'search3',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index3',
                filter: []
              }
            )
          }
        };

        const dash4 = {
          id: 'invisibledashboard4',
          title: 'dashboard4',
          savedSearchId: 'search4',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(
              {
                index: 'index4',
                filter: []
              }
            )
          }
        };

        init({
          savedDashboards: [dash1, dash2],
          groups: [
            {
              id: 'group odd dashboards',
              selected: dash1,
              dashboards: [dash1, dash3]
            },
            {
              id: 'group even dashboards',
              selected: dash2,
              dashboards: [dash2, dash4]
            }
          ]
        });
      });

      it('do not update count on a dashboard if it is not returned from elastic', function () {
        getDashboardsMetadataStub.returns(Promise.resolve([
          {
            dashboardId: 'dashboard1',
            count: 42,
            queries: [ getDefaultQuery() ],
            filters: [],
            isPruned: false
          }
        ]));

        return kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2' ])
        .then(() => {
          expect(dashboardGroups.getGroups()).to.have.length(2);
          expect(dashboardGroups.getGroups()[0].id).to.be('group odd dashboards');
          expect(dashboardGroups.getGroups()[0].selected.count).to.be(42);
          expect(dashboardGroups.getGroups()[1].id).to.be('group even dashboards');
          expect(dashboardGroups.getGroups()[1].selected.count).to.not.be.ok();
        });
      });

      it('update counts only on visible dashboards', function () {

        // not important as in this tests we will not test the count values
        // but we have to define that it returns somenthig to avoid undefined error
        getDashboardsMetadataStub.returns(Promise.resolve([]));

        kibiNavBarHelper.updateAllCounts([ 'dashboard1', 'dashboard2', 'dashboard3', 'dashboard4' ]);

        getDashboardsMetadataStub.calledWith(['dashboard1', 'dashboard2']);
      });
    });
  });

});
