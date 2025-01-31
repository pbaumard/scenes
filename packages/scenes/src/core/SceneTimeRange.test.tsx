import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { PanelBuilders } from './PanelBuilders';
import { SceneTimeRange } from './SceneTimeRange';

describe('SceneTimeRange', () => {
  it('when created should evaluate time range', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    expect(timeRange.state.value.raw.from).toBe('now-1h');
  });

  it('when time range refreshed should evaluate and update value', async () => {
    const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now' });
    const startTime = timeRange.state.value.from.valueOf();
    await new Promise((r) => setTimeout(r, 2));
    timeRange.onRefresh();
    const diff = timeRange.state.value.from.valueOf() - startTime;
    expect(diff).toBeGreaterThan(0);
  });

  it('toUrlValues with relative range', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    expect(timeRange.urlSync?.getUrlState()).toEqual({
      from: 'now-1h',
      to: 'now',
    });
  });

  it('updateFromUrl with ISO time', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    timeRange.urlSync?.updateFromUrl({
      from: '2021-01-01T10:00:00.000Z',
      to: '2021-02-03T01:20:00.000Z',
    });

    expect(timeRange.state.from).toEqual('2021-01-01T10:00:00.000Z');
    expect(timeRange.state.value.from.valueOf()).toEqual(1609495200000);
  });

  describe('time zones', () => {
    describe('when time zone is not specified', () => {
      it('should return default time zone', () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
        expect(timeRange.getTimeZone()).toBe('browser');
      });
      it('should return time zone of the closest range with time zone specified ', () => {
        const outerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
        const innerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
        const scene = new SceneFlexLayout({
          $timeRange: outerTimeRange,
          children: [
            new SceneFlexItem({
              $timeRange: innerTimeRange,
              body: PanelBuilders.text().build(),
            }),
          ],
        });
        scene.activate();
        expect(innerTimeRange.getTimeZone()).toEqual(outerTimeRange.getTimeZone());
      });
    });
    describe('when time zone is specified', () => {
      it('should return own time zone', () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
        expect(timeRange.getTimeZone()).toBe('America/New_York');
      });
      it('should return own time zone ignoring of the outer range', () => {
        const outerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
        const innerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'Europe/Berlin' });
        const scene = new SceneFlexLayout({
          $timeRange: outerTimeRange,
          children: [
            new SceneFlexItem({
              $timeRange: innerTimeRange,
              body: PanelBuilders.text().build(),
            }),
          ],
        });
        scene.activate();
        expect(innerTimeRange.getTimeZone()).toEqual('Europe/Berlin');
      });
    });
  });
});
