/* *
 *
 *  (c) 2010-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

import Axis from './Axis.js';
import H from './Globals.js';
import U from './Utilities.js';
const {
    addEvent,
    defined,
    pick
} = U;

/* eslint-disable no-invalid-this */

/**
 * Creates scrollbars if enabled.
 * @private
 */
class ScrollbarAxis {

    /**
     * Attaches to axis events to create scrollbars if enabled.
     *
     * @private
     *
     * @param {Highcharts.Scrollbar} ScrollbarClass
     * The scrollbar class to use.
     */
    public static init(ScrollbarClass: typeof Highcharts.Scrollbar): void {

        // Wrap axis initialization and create scrollbar if enabled:
        addEvent(Axis, 'afterInit', function (): void {
            var axis = this;

            if (
                axis.options &&
                axis.options.scrollbar &&
                axis.options.scrollbar.enabled
            ) {
                // Predefined options:
                axis.options.scrollbar.vertical = !axis.horiz;
                axis.options.startOnTick = axis.options.endOnTick = false;

                axis.scrollbar = new ScrollbarClass(
                    axis.chart.renderer,
                    axis.options.scrollbar,
                    axis.chart
                );

                addEvent(axis.scrollbar as any, 'changed', function (
                    this: Highcharts.Scrollbar,
                    e: Highcharts.ScrollbarChangedEventObject
                ): void {
                    var unitedMin = Math.min(
                            pick(axis.options.min, axis.min as any),
                            axis.min as any,
                            axis.dataMin as any
                        ),
                        unitedMax = Math.max(
                            pick(axis.options.max, axis.max as any),
                            axis.max as any,
                            axis.dataMax as any
                        ),
                        range = unitedMax - unitedMin,
                        to,
                        from;

                    if (
                        (axis.horiz && !axis.reversed) ||
                        (!axis.horiz && axis.reversed)
                    ) {
                        to = unitedMin + range * (this.to as any);
                        from = unitedMin + range * (this.from as any);
                    } else {
                        // y-values in browser are reversed, but this also
                        // applies for reversed horizontal axis:
                        to = unitedMin + range * (1 - (this.from as any));
                        from = unitedMin + range * (1 - (this.to as any));
                    }

                    if (
                        pick(
                            this.options.liveRedraw,
                            H.svg && !H.isTouchDevice && !this.chart.isBoosting
                        ) ||
                        // Mouseup always should change extremes
                        e.DOMType === 'mouseup' ||
                        // Internal events
                        !defined(e.DOMType)
                    ) {
                        axis.setExtremes(
                            from,
                            to,
                            true,
                            e.DOMType !== 'mousemove',
                            e
                        );
                    } else {
                        // When live redraw is disabled, don't change extremes
                        // Only change the position of the scollbar thumb
                        this.setRange(this.from as any, this.to as any);
                    }
                });
            }
        });

        // Wrap rendering axis, and update scrollbar if one is created:
        addEvent(Axis, 'afterRender', function (this: Highcharts.Axis): void {
            var axis = this,
                scrollMin = Math.min(
                    pick(axis.options.min, axis.min as any),
                    axis.min as any,
                    pick(axis.dataMin, axis.min as any) // #6930
                ),
                scrollMax = Math.max(
                    pick(axis.options.max, axis.max as any),
                    axis.max as any,
                    pick(axis.dataMax, axis.max as any) // #6930
                ),
                scrollbar = axis.scrollbar,
                offset = (axis.axisTitleMargin as any) + (axis.titleOffset || 0),
                scrollbarsOffsets = axis.chart.scrollbarsOffsets,
                axisMargin = axis.options.margin || 0,
                offsetsIndex,
                from,
                to;

            if (scrollbar) {

                if (axis.horiz) {

                    // Reserve space for labels/title
                    if (!axis.opposite) {
                        (scrollbarsOffsets as any)[1] += offset;
                    }

                    scrollbar.position(
                        axis.left,
                        axis.top + axis.height + 2 + (scrollbarsOffsets as any)[1] -
                            (axis.opposite ? axisMargin : 0),
                        axis.width,
                        axis.height
                    );

                    // Next scrollbar should reserve space for margin (if set)
                    if (!axis.opposite) {
                        (scrollbarsOffsets as any)[1] += axisMargin;
                    }

                    offsetsIndex = 1;
                } else {

                    // Reserve space for labels/title
                    if (axis.opposite) {
                        (scrollbarsOffsets as any)[0] += offset;
                    }

                    scrollbar.position(
                        axis.left + axis.width + 2 + (scrollbarsOffsets as any)[0] -
                            (axis.opposite ? 0 : axisMargin),
                        axis.top,
                        axis.width,
                        axis.height
                    );

                    // Next scrollbar should reserve space for margin (if set)
                    if (axis.opposite) {
                        (scrollbarsOffsets as any)[0] += axisMargin;
                    }

                    offsetsIndex = 0;
                }

                (scrollbarsOffsets as any)[offsetsIndex] += scrollbar.size +
                    (scrollbar.options.margin as any);

                if (
                    isNaN(scrollMin) ||
                    isNaN(scrollMax) ||
                    !defined(axis.min) ||
                    !defined(axis.max) ||
                    axis.min === axis.max // #10733
                ) {
                    // default action: when extremes are the same or there is
                    // not extremes on the axis, but scrollbar exists, make it
                    // full size
                    scrollbar.setRange(0, 1);
                } else {
                    from =
                        ((axis.min as any) - scrollMin) / (scrollMax - scrollMin);
                    to =
                        ((axis.max as any) - scrollMin) / (scrollMax - scrollMin);

                    if (
                        (axis.horiz && !axis.reversed) ||
                        (!axis.horiz && axis.reversed)
                    ) {
                        scrollbar.setRange(from, to);
                    } else {
                        // inverse vertical axis
                        scrollbar.setRange(1 - to, 1 - from);
                    }
                }
            }
        });

        // Make space for a scrollbar:
        addEvent(Axis, 'afterGetOffset', function (this: Highcharts.Axis): void {
            var axis = this,
                index = axis.horiz ? 2 : 1,
                scrollbar = axis.scrollbar;

            if (scrollbar) {
                axis.chart.scrollbarsOffsets = [0, 0]; // reset scrollbars offsets
                axis.chart.axisOffset[index] +=
                    scrollbar.size + (scrollbar.options.margin as any);
            }
        });

    }
}

export default ScrollbarAxis;
