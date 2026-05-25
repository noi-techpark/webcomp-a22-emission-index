// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Component,
  Element,
  forceUpdate,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch
} from "@stencil/core";
import { DivIcon, LayerGroup, Map, Marker, Polyline, Popup } from 'leaflet';
import { getLayoutClass, resolveLayoutAuto, ViewLayout } from "../../utils/breakpoints";
import { LanguageDataService } from "../../data/language/language-data-service";
import { StencilComponent } from "../../utils/StencilComponent";
import { EmissionsDataService } from "../../data/emissions/emissions-data.service";
import { EmissionCluster, EmissionData } from "../../data/emissions/EmissionData";

/**
 * Road air quality component
 *
 * @part list - stations list
 * @part map - Map
 * @part marker - Map marker
 * @part marker-icon - Map marker icon
 * @part popup - Popup dialog
 */
@Component({
  tag: 'noi-a22-emission-index',
  styleUrl: 'emission-index.css',
  shadow: true,
})
export class EmissionIndexComponent implements StencilComponent {

  /**
   * Language
   */
  @Prop({mutable: true})
  language = 'en';

  /**
   * Layout appearance
   */
  @Prop({mutable: true})
  layout: ViewLayout = 'auto';

  /**
   * Hides legend threshold values
   */
  @Prop({mutable: true})
  legendHideThreshold = false;

  @State()
  layoutResolved: ViewLayout;

  sizeObserver: ResizeObserver = null;

  map: Map;
  markersLayer: LayerGroup;
  markerMap: { [stationId: string]: Marker } = {};

  selectedClusterId: string = null;
  selectedMarker: Marker = null;
  selectedMarkerPopup: Popup = null;

  @State()
  stationsList: EmissionData[] | null = [];

  @State()
  stationsClusters: EmissionCluster[] | null = [];

  @State()
  selectedCluster: EmissionCluster = null;

  @State()
  isMenuOpened = false;

  @Element() el: HTMLElement;

  airQualityDataService: EmissionsDataService;
  languageService: LanguageDataService;

  constructor() {
    this.onBackdropClick = this.onBackdropClick.bind(this);
    this.itemClick = this.itemClick.bind(this);
    this._onLanguageChanged = this._onLanguageChanged.bind(this);
    this.mapReady = this.mapReady.bind(this);

    this.languageService = LanguageDataService.getInstance();
    this.airQualityDataService = new EmissionsDataService();
  }

  connectedCallback() {
    this.languageService.onLanguageChange.bind(this._onLanguageChanged);
    this.languageService.useLanguage(this.language);
    this._recalculateLayoutClass();
    this._watchSize();
  }

  disconnectedCallback() {
    this.languageService.onLanguageChange.unbind(this._onLanguageChanged);
    this._unwatchSize();
  }

  _onLanguageChanged() {
    this._recalculateMarkers();
    forceUpdate(this.el);
  }

  /**
   * Reload camera data
   */
  @Method()
  async refreshData() {
    // re-subscribe to data source
    if (this.map) {
      await this.airQualityDataService.getEmission()
        .then(result => {
          this.stationsList = result.stations;
          this.stationsClusters = result.clusters;
          this._recalculateMarkers();
        });
    }
    forceUpdate(this.el);
  }

  @Watch('language')
  onLanguageChange() {
    return this.languageService.useLanguage(this.language);
  }

  async mapReady(event: CustomEvent<Map>) {
    this.map = event.detail;

    this.markersLayer = new LayerGroup();
    this.map.addLayer(this.markersLayer);

    // get route points
    const routePath = await this.airQualityDataService.getRoutePath();
    const roadLine = new Polyline([], {className: 'noi-map-line'});
    for (const p of routePath) {
      roadLine.addLatLng(p);
    }
    this.map.addLayer(roadLine);

    // center on line
    const bounds = roadLine.getBounds();
    this.map.setView(bounds.getCenter());
    this.map.setZoom(8); // TODO: zoom to fill the line

    ///
    this.map.addEventListener('popupclose', () => {
      this._selectStationCluster(null);
    });

    //
    this.refreshData();
  }

  _recalculateMarkers() {
    this.markersLayer?.clearLayers();
    this.markerMap = {};

    //
    this.selectedMarkerPopup?.closePopup();
    this.selectedMarkerPopup?.close();
    this.selectedMarkerPopup = null;
    this.selectedClusterId = null;
    this.selectedCluster = null;
    this.selectedMarker = null;

    for (const cluster of this.stationsClusters) {

      if (!cluster.uid) {
        console.warn('Item skipped: missing cluster ID');
        continue;
      }

      //// create map marker
      const markerIcon = new DivIcon({
        html: `<div class="noi-marker level--${cluster.level}" part="marker"
            ><noi-icon name="pointer" part="marker-icon"></noi-icon></div>`,
        className: 'noi-marker-leaflet',
        // className: markerID + " icona-multipla-" + nMarkers + " direzione-" + IDTratta.toLowerCase(),

        iconSize: [24, 24], // size of the icon
        iconAnchor: [12, 22] // point of the icon which will correspond to marker's location
      });

      const marker = new Marker(cluster.coordinate, {icon: markerIcon});
      this.markerMap[cluster.uid] = marker;
      marker.addEventListener('click', () => {
        this._selectStationCluster(cluster.uid);
      });
      this.markersLayer.addLayer(marker);
    }
  }

  _selectStationCluster(clusterId?: string) {
    // remove selection
    if (this.selectedMarker) {
      this.selectedMarker.getElement()?.classList.remove('selected');
    }

    // assign new data
    this.selectedClusterId = clusterId;
    this.selectedMarker = this.markerMap[this.selectedClusterId];
    this.selectedCluster = this.stationsClusters.find(wc => wc.uid === this.selectedClusterId);

    console.log('Station selected:', this.selectedCluster);

    // add selection
    if (this.selectedMarker) {
      this.selectedMarker.getElement().classList.add('selected');

      // popup is destroyed by leaflet when it's closed
      this.selectedMarkerPopup = new Popup(this.selectedMarker.getLatLng(), {
        offset: [0, -14],
        content: this.getPopupHTML_proposal(this.selectedCluster),
        closeButton: false, // 'closeButton' is not declared in types
        autoPan: true,
      } as any).openOn(this.map);
    }

    forceUpdate(this.el);
  }

  onBackdropClick() {
    this._selectStationCluster(null);
  }

  itemClick(event: CustomEvent<EmissionData>) {
    this.isMenuOpened = false; // close menu if opened
    setTimeout(()=>{
      this._selectStationCluster(event.detail.clusterId);
    });
  }

  @Watch('layout')
  _recalculateLayoutClass() {
    this.layoutResolved = resolveLayoutAuto(this.el.offsetWidth, this.layout);
  }

  _watchSize() {
    if (typeof window.ResizeObserver === 'function') {
      this.sizeObserver = new ResizeObserver(() => {
        this._recalculateLayoutClass();
      });
      this.sizeObserver.observe(this.el);
    } else {
      console.warn('ResizeObserver is not supported');
    }
  }

  _unwatchSize() {
    if (this.sizeObserver) {
      this.sizeObserver.unobserve(this.el);
      this.sizeObserver = null;
    }
  }

  _toggleMenu() {
    this.isMenuOpened = !this.isMenuOpened;
  }


  render() {
    const isPanelHiddenForMobile = !this.isMenuOpened && this.layoutResolved === 'mobile';
    return (
      <Host class={getLayoutClass(this.layoutResolved)}>
        <div class="layout__content">
          <noi-emission-data-list class={'layout__list ' + (isPanelHiddenForMobile ? 'layout__list--hidden' : '')}
                                  part="list"
                                  stationArr={this.stationsList}
                                  onItemClick={e => this.itemClick(e)}>
            {this.layoutResolved === 'mobile'
              ? <noi-button class="menu-button menu-button--list" slot="title" onClick={() => this._toggleMenu()}>
                  <noi-icon name="close"></noi-icon>
                </noi-button>
              :''
            }
          </noi-emission-data-list>
          <div class="layout__center">

            {isPanelHiddenForMobile
              ? <div class="menu-button-wrapper">
                <noi-button class="menu-button" onClick={() => this._toggleMenu()}>
                    <noi-icon name="menu"></noi-icon>
                  </noi-button>
                </div>
              :''
            }

            <noi-map part="map" onMapReady={e => this.mapReady(e)}></noi-map>
          </div>
        </div>
        {this._renderLegend()}
      </Host>
    );
  }

  getPopupHTML(cluster: EmissionCluster) {
    // const station = cluster.stations[0];
    const stationsHtml = cluster.stations.map(station => {
      return `
      <div class="popup__title">
        <span class="popup__title-box level--${station.level}"></span>
        <span class="popup__title-text">${station.station.sname}</span>
      </div>
      <div class="popup__border"></div>
      <div class="popup__values">
        <span class="popup__values-label">${this.languageService.translate('app.parameter.nox')} </span>
        <span class="popup__values-value">${this.languageService.translate('pollution--' + station.nox?.mvalue)}</span>
      </div>
      <!--
      <div class="popup__date">
        <noi-icon name="info"></noi-icon>
        <span>${this.languageService.translate('app.measureTime')}: ${station.nox?.mvalidtime}</span>
      </div>
      -->
      <div class="popup__border"></div>
      <div class="popup__values">
        <span class="popup__values-label">${this.languageService.translate('app.parameter.co2')} </span>
        <span class="popup__values-value">${this.languageService.translate('pollution--' + station.co2?.mvalue)}</span>
      </div>
      <!--
      <div class="popup__date">
        <noi-icon name="info"></noi-icon>
        <span>${this.languageService.translate('app.measureTime')}: ${station.co2?.mvalidtime}</span>
      </div>
      -->
   `;
    });

    return `<div class="popup" part="popup">${stationsHtml.join('')}</div>`;
  }


  getPopupHTML_proposal(cluster: EmissionCluster) {
    // const station = cluster.stations[0];
    return `
    <div class="popup2 ${getLayoutClass(this.layoutResolved)}" part="popup">
        <div class="popup2__title">${cluster.namePretty}</div>
        <div class="popup2__content">

            <div class="lane-direction">
              <div class="lane-direction__label border-bottom border-top border-right--desktop">${this.languageService.translate('direction.south')}</div>
              <div class="lane-direction__value">
                  <div class="lane border-right">
                      <div class="lane__label">${this._lane_icon('south-slow')} ${this.languageService.translate('lane.slow')}</div>

                      <div class="lane__content">
                        <div class="lane__value">${this._emission_value(cluster.southSlowLane)}</div>
                      </div>
                  </div>

                  <div class="lane border-right--d">
                      <div class="lane__label">${this._lane_icon('south-fast')} ${this.languageService.translate('lane.fast')}</div>

                      <div class="lane__content">
                        <div class="lane__value">${this._emission_value(cluster.southFastLane)}</div>
                      </div>
                  </div>
              </div>
            </div>


            <div class="lane-direction">
              <div class="lane-direction__label border-bottom border-top">${this.languageService.translate('direction.north')}</div>
              <div class="lane-direction__value">
                  <div class="lane border-right">
                      <div class="lane__label">${this._lane_icon('north-fast')} ${this.languageService.translate('lane.fast')}</div>

                      <div class="lane__content">
                        <div class="lane__value">${this._emission_value(cluster.northFastLane)}</div>
                      </div>
                  </div>

                  <div class="lane">
                      <div class="lane__label">${this._lane_icon('north-slow')} ${this.languageService.translate('lane.slow')}</div>

                      <div class="lane__content">
                        <div class="lane__value">${this._emission_value(cluster.northSlowLane)}</div>
                      </div>
                  </div>
              </div>
            </div>
        </div>
    </div>`;
  }

  _emission_value(station?: EmissionData) {
    return `
        <div class="emission">
          <span class="emission__label">${this.languageService.translate('app.parameter.nox')} </span>
          <span class="emission__value level--${station?.nox?.mvalue || 'unknown'}">
            ${this.languageService.translate('pollution--' + (station?.nox?.mvalue || 'unknown'))}
          </span>
        </div>
        <div class="emission-date">
            ${station?.nox?.formattedDate || ''}
        </div>
        <div class="emission-spacer"></div>

        <div class="emission">
          <span class="emission__label">${this.languageService.translate('app.parameter.co2')} </span>
          <span class="emission__value level--${station?.co2?.mvalue || 'unknown'}">
            ${this.languageService.translate('pollution--' + (station?.co2?.mvalue || 'unknown'))}
          </span>
        </div>
        <div class="emission-date">
            ${station?.co2?.formattedDate || ''}
        </div>
        <div class="emission-spacer"></div>
    `;
  }

  _renderLegend() {
    return (<div class="layout__legend" part="footer">
      <div class="legend">

        <div class="legend__item level--low">
          <div class="legend__item-content level--low-contrast">
            {this.languageService.translate('pollution--low')}
          </div>
        </div>

        <div class="legend__item level--medium">
          <div class="legend__item-content level--medium-contrast">
            {this.languageService.translate('pollution--medium')}
          </div>
        </div>

        <div class="legend__item level--high">
          <div class="legend__item-content level--high-contrast">
            {this.languageService.translate('pollution--high')}
          </div>
        </div>

      </div>
    </div>);
  }

  _lane_icon(name: string) {
    switch (name) {
      case 'south-fast':
        return `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" width="1.5em" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-200 240-440l56-56 184 183 184-183 56 56-240 240Zm0-240L240-680l56-56 184 183 184-183 56 56-240 240Z"/></svg>`;
      case 'north-fast':
        return `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" width="1.5em" viewBox="0 -960 960 960" fill="currentColor"><path d="m296-224-56-56 240-240 240 240-56 56-184-183-184 183Zm0-240-56-56 240-240 240 240-56 56-184-183-184 183Z"/></svg>`;
      case 'south-slow':
        return `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" width="1.5em" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/></svg>`;
      case 'north-slow':
        return `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" width="1.5em" viewBox="0 -960 960 960" fill="currentColor"><path d="m296-345-56-56 240-240 240 240-56 56-184-183-184 183Z"/></svg>`;
    }
  }
}
