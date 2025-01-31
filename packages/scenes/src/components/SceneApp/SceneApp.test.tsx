import { NavModelItem } from '@grafana/data';
import { PluginPageProps } from '@grafana/runtime';
import { screen, render } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';
import { SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneCanvasText } from '../SceneCanvasText';
import { SceneApp } from './SceneApp';
import { SceneAppPage } from './SceneAppPage';
import { SceneRouteMatch } from './types';

let history = createMemoryHistory();
let pluginPageProps: PluginPageProps | undefined;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  PluginPage: function PluginPageMock(props: PluginPageProps) {
    pluginPageProps = props;
    return <div>{props.children}</div>;
  },
}));

describe('SceneApp', () => {
  const original = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = original;
  });

  it('should error when rendered outside of a router context', () => {
    const page1Scene = setupScene(new SceneCanvasText({ text: 'Page 1' }));
    const app = new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          getScene: () => {
            return page1Scene;
          },
        }),
      ],
    });

    expect(() => render(<app.Component model={app} />)).toThrowErrorMatchingInlineSnapshot(
      `"Invariant failed: You should not use <Switch> outside a <Router>"`
    );
  });

  describe('Given an app with two pages', () => {
    const p1Object = new SceneCanvasText({ text: 'Page 1' });
    const p2Object = new SceneCanvasText({ text: 'Page 2' });
    const page1Scene = setupScene(p1Object);
    const page2Scene = setupScene(p2Object);

    const app = new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          getScene: () => {
            return page1Scene;
          },
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          getScene: () => {
            return page2Scene;
          },
        }),
      ],
    });

    beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test'));

    it('should render correct page on mount', async () => {
      expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Can navigate to other page', async () => {
      history.push('/test1');

      expect(await screen.findByTestId(p2Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
    });
  });

  describe('Given a page with two tabs', () => {
    const p2Object = new SceneCanvasText({ text: 'Page 2' });
    const t1Object = new SceneCanvasText({ text: 'Tab 1' });
    const t2Object = new SceneCanvasText({ text: 'Tab 2' });

    const app = new SceneApp({
      pages: [
        // Page with tabs
        new SceneAppPage({
          title: 'Container page',
          url: '/test',
          tabs: [
            new SceneAppPage({
              title: 'Tab1',
              url: '/test/tab1',
              getScene: () => setupScene(t1Object),
            }),
            new SceneAppPage({
              title: 'Tab2',
              url: '/test/tab2',
              getScene: () => setupScene(t2Object),
            }),
          ],
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          getScene: () => setupScene(p2Object),
        }),
      ],
    });

    beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test'));

    it('should render correct breadcrumbs', async () => {
      expect(flattenPageNav(pluginPageProps?.pageNav!)).toEqual(['Container page']);
    });

    it('Render first tab with the url of the parent', () => {
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(t2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Render first tab with its own url', async () => {
      history.push('/test/tab1');
      expect(await screen.findByTestId(t1Object.state.key!)).toBeInTheDocument();
    });

    it('Can render second tab', async () => {
      history.push('/test/tab2');

      expect(await screen.findByTestId(t2Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).not.toBeInTheDocument();
    });
  });

  describe('drilldowns', () => {
    describe('Drilldowns on page level', () => {
      const p1Object = new SceneCanvasText({ text: 'Page 1' });
      const page1Scene = setupScene(p1Object);

      const app = new SceneApp({
        pages: [
          // Page with tabs
          new SceneAppPage({
            title: 'Top level page',
            url: '/test-drilldown',
            getScene: () => {
              return page1Scene;
            },
            drilldowns: [
              {
                routePath: '/test-drilldown/:id',
                getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                  return new SceneAppPage({
                    title: `Drilldown ${match.params.id}`,
                    url: `/test-drilldown/${match.params.id}`,
                    getScene: () => getDrilldownScene(match),
                    getParentPage: () => parent,
                  });
                },
              },
            ],
          }),
        ],
      });

      beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test-drilldown'));

      it('should render a drilldown page', async () => {
        expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();

        history.push('/test-drilldown/some-id');

        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

        // Verify pageNav is correct
        expect(flattenPageNav(pluginPageProps?.pageNav!)).toEqual(['Drilldown some-id', 'Top level page']);

        history.push('/test-drilldown/some-other-id');

        expect(await screen.findByText('some-other-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
        expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();
      });

      it('When url does not match any drilldown sub page show fallback route', async () => {
        history.push('/test-drilldown/some-id/does-not-exist');
        expect(await screen.findByTestId('default-fallback-content')).toBeInTheDocument();
      });

      describe('Drilldowns on page level with tabs', () => {
        const p1Object = new SceneCanvasText({ text: 'Page 1' });
        const page1Scene = setupScene(p1Object);

        const app = new SceneApp({
          pages: [
            // Page with tabs
            new SceneAppPage({
              title: 'Top level page',
              url: '/main',
              tabs: [
                new SceneAppPage({
                  title: 'Tab ',
                  url: '/main/tab',
                  getScene: () => {
                    return page1Scene;
                  },
                }),
              ],
              drilldowns: [
                {
                  routePath: '/main/drilldown/:id',
                  getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                    return new SceneAppPage({
                      title: `Drilldown ${match.params.id}`,
                      url: `/main/drilldown/${match.params.id}`,
                      getScene: () => getDrilldownScene(match),
                      getParentPage: () => parent,
                    });
                  },
                },
              ],
            }),
          ],
        });

        beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/main/drilldown/10'));

        it('should render a drilldown page', async () => {
          expect(await screen.findByText('10 drilldown!')).toBeInTheDocument();
          expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

          // Verify pageNav is correct
          expect(flattenPageNav(pluginPageProps?.pageNav!)).toEqual(['Drilldown 10', 'Top level page']);
        });
      });
    });

    describe('Drilldowns on tab level', () => {
      const p1Object = new SceneCanvasText({ text: 'Page 1' });
      const t1Object = new SceneCanvasText({ text: 'Tab 1' });
      const tab1Scene = setupScene(t1Object);
      let drillDownScenesGenerated = 0;

      const app = new SceneApp({
        pages: [
          // Page with tabs
          new SceneAppPage({
            title: 'Container page',
            url: '/test',
            tabs: [
              new SceneAppPage({
                title: 'Tab ',
                url: '/test/tab',
                getScene: () => {
                  return tab1Scene;
                },
                drilldowns: [
                  {
                    routePath: '/test/tab/:id',
                    getPage: (match: SceneRouteMatch<{ id: string }>) => {
                      drillDownScenesGenerated++;

                      return new SceneAppPage({
                        title: 'drilldown',
                        url: `/test/tab/${match.params.id}`,
                        getScene: () => getDrilldownScene(match),
                      });
                    },
                  },
                ],
              }),
            ],
          }),
        ],
      });

      beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test/tab'));

      it('should render a drilldown that is part of tab page', async () => {
        expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();

        history.push('/test/tab/some-id');

        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

        history.push('/test/tab/some-other-id');

        expect(await screen.findByText('some-other-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
        expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();

        // go back to the first drilldown
        history.push('/test/tab/some-id');
        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();

        // Verify that drilldown page was cached (getPage should not have been called again)
        expect(drillDownScenesGenerated).toBe(2);
      });

      it('When url does not match any drilldown sub page show fallback route', async () => {
        history.push('/test/tab/drilldown-id/does-not-exist');
        expect(await screen.findByTestId('default-fallback-content')).toBeInTheDocument();
      });
    });
  });
});

function setupScene(inspectableObject: SceneObject) {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [new SceneFlexItem({ body: inspectableObject })],
    }),
  });
}

function getDrilldownScene(match: SceneRouteMatch<{ id: string }>) {
  return setupScene(new SceneCanvasText({ text: `${match.params.id} drilldown!` }));
}

function renderAppInsideRouterWithStartingUrl(app: SceneApp, startingUrl: string) {
  history.push(startingUrl);
  render(
    <Router history={history}>
      <app.Component model={app} />
    </Router>
  );
}

function flattenPageNav(pageNav: NavModelItem | undefined) {
  const items: string[] = [];

  while (pageNav) {
    items.push(pageNav.text);
    pageNav = pageNav.parentItem;
  }

  return items;
}
