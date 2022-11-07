import { Component, Injector, ViewChild, ComponentFactoryResolver, NgZone } from '@angular/core';
import { Place } from '../../services/place-service';
import { MapStyle } from '../../services/map-style';
import { BasePage } from '../base-page/base-page';
import { InfoWindowComponent } from '../../components/info-window/info-window';
import { environment } from '../../../environments/environment';
import { IonSearchbar, isPlatform } from '@ionic/angular';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { DomSanitizer } from '@angular/platform-browser'
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger
} from '@angular/animations';
import Utils from 'src/app/utils';
import { Location } from '@angular/common';
import { GoogleMap } from '@angular/google-maps';
import { CupertinoPane, CupertinoSettings } from 'cupertino-pane';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: `translate3d(0,10px,0)` }), { optional: true }),
        query(':enter', stagger('100ms', [animate('300ms', style({ opacity: 1, transform: `translate3d(0,0,0)` }))]), { optional: true })
      ])
    ])
  ]
})
export class MapPage extends BasePage {

  @ViewChild(IonSearchbar, { static: true }) searchBar: IonSearchbar;
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;

  public snazzyInfoWindow: any;

  public params: any = {
    page: 0
  };

  public suggestions: any = [];
  public places: Place[] = [];

  public cupertinoPane: CupertinoPane;

  public geocoder: google.maps.Geocoder;
  public markers: google.maps.Marker[] = [];
  public autocompleteService: google.maps.places.AutocompleteService;
  public placesService: google.maps.places.PlacesService;
  public myLocationMarker: google.maps.Marker;

  public mapInitialized: boolean = false;
  public location: any;
  public zoomMyLocation: boolean = true;

  public placeToInfoWindow: Map<string, any>;
  public activeInfoWindow: any;

  public mapOptions: google.maps.MapOptions = {};

  public keyboardDidShowListener: any;
  public keyboardDidHideListener: any;

  public cupertinoInitialBreakPoint: number = 200;

  constructor(private injector: Injector,
    public sanitizer: DomSanitizer,
    private zone: NgZone,
    private resolver: ComponentFactoryResolver,
    private placeService: Place,
    private locationService: Location,
    private geolocationService: GeolocationService) {
    super(injector);
    this.params.unit = this.preference.unit;
  }

  enableMenuSwipe() {
    return false;
  }

  ngOnInit() {
    this.setupQueryParams();
    this.setupCupertinoPane();

    if (Capacitor.isNativePlatform()) {
      this.listenKeyboard();
    }

  }

  ngOnDestroy() {
    if (Capacitor.isNativePlatform()) {
      this.unListenKeyboard();
    }
  }

  setupCupertinoPane() {

    const safeAreaBottom = getComputedStyle(document.documentElement)
      .getPropertyValue("--ion-safe-area-bottom");

    const settings: CupertinoSettings = {
      breaks: {
        bottom: {
          enabled: true,
          height: this.cupertinoInitialBreakPoint + parseFloat(safeAreaBottom.replace('px', ''))
        },
      },
      initialBreak: 'bottom',
      freeMode: false,
      buttonClose: false,
      topperOverflow: true,
      handleKeyboard: false,
    };

    this.cupertinoPane = new CupertinoPane('.cupertino-pane', settings);
  }

  listenKeyboard() {

    this.keyboardDidShowListener = () => {
      if (!this.cupertinoPane.isHidden()) {
        setTimeout(() => {
          this.cupertinoPane.hide();
        }, 300);
      }
    };

    this.keyboardDidHideListener = () => {
      if (this.places.length) {
        this.cupertinoPane.present({ animate: true });
      }
    };

    window.addEventListener(
      'ionKeyboardDidShow',
      this.keyboardDidShowListener,
    );

    window.addEventListener(
      'ionKeyboardDidHide',
      this.keyboardDidHideListener,
    );
  }

  unListenKeyboard() {

    window.removeEventListener(
      'ionKeyboardDidShow',
      this.keyboardDidShowListener
    );

    window.removeEventListener(
      'ionKeyboardDidHide',
      this.keyboardDidHideListener
    );
  }

  setupQueryParams() {

    const featured = this.getQueryParams().featured;
    if (featured) {
      this.params.featured = featured;
    }

    const cat = this.getQueryParams().cat;
    if (cat) {
      this.params.cat = cat;
    }

    const ratingMin = this.getQueryParams().ratingMin;
    if (ratingMin) {
      this.params.ratingMin = Number(ratingMin);
    }

    const ratingMax = this.getQueryParams().ratingMax;
    if (ratingMax) {
      this.params.ratingMax = Number(ratingMax);
    }

    const maxDistance = this.getQueryParams().maxDistance;
    if (maxDistance) {
      this.params.maxDistance = Number(maxDistance);
    }

    let lat = this.getQueryParams().latitude;
    let lng = this.getQueryParams().longitude;

    if (lat && lng) {
      lat = Number(lat);
      lng = Number(lng);
      this.params.latitude = lat;
      this.params.longitude = lng;
    }

    const address = this.getQueryParams().address;

    if (address) {
      this.params.address = this.getQueryParams().address;
    }
  }

  async updateSearchBarValue(val: string) {
    await Utils.sleep(800);
    this.searchBar.value = val;
  }

  async ionViewDidEnter() {

    if (this.params.address) {
      this.updateSearchBarValue(this.params.address);
    }

    if (typeof google === 'undefined') {
      this.loadGoogleMaps();
    } else if (!this.mapInitialized) {
      this.initMap();
    }

    const title = await this.getTrans('MAP');
    this.setPageTitle(title);

    this.setMetaTags({
      title: title
    });
  }

  async loadGoogleMaps() {

    window['mapInit'] = () => {
      this.zone.run(() => this.initMap());
    };

    const apiKey = environment.googleMapsApiKey;

    const script = document.createElement('script');
    script.id = 'googleMaps';
    script.src = `https://maps.google.com/maps/api/js?key=${apiKey}&callback=mapInit&libraries=places`;
    document.body.appendChild(script);
  }

  async initMap() {

    this.snazzyInfoWindow = require('snazzy-info-window');

    this.mapInitialized = true;

    setTimeout(async () => {

      const styles: any = this.preference.isDarkModeEnabled
        ? MapStyle.dark()
        : MapStyle.light();

      const isDesktop = isPlatform('desktop');

      this.mapOptions = {
        center: { lat: 0, lng: 0 },
        styles: styles,
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: isDesktop,
        streetViewControl: isDesktop,
        zoomControl: isDesktop,
        fullscreenControl: isDesktop,
      };

      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.placesService = new google.maps.places.PlacesService(this.map.googleMap);

      const text = await this.getTrans('SEARCH_THIS_AREA');

      const component = document.createElement('ion-button');
      component.innerText = text;
      component.shape = 'round';
      component.size = 'small';
      component.color = 'secondary';
      component.strong = true;
      component.classList.add('btn-search-map');
      component.onclick = () => this.onSearchButtonTapped();

      this.map.googleMap.controls[google.maps.ControlPosition.TOP_CENTER].push(component);

      try {

        let location = null;

        if (this.params.latitude && this.params.longitude) {
          location = {
            latitude: this.params.latitude,
            longitude: this.params.longitude,
          };
        } else {
          location = await this.geolocationService.getCurrentPosition();
        }

        if (location) {
          this.location = location;
          this.loadData();
        }

      } catch {
        this.translate.get('ERROR_LOCATION_UNAVAILABLE')
          .subscribe(str => this.showToast(str));
      }
    });


  }

  setMapOnAll(map: any) {
    this.markers.forEach(marker => {
      marker.setMap(map);
    });
  }

  onClearSearchAddress() {
    this.suggestions = [];
  }

  onSearchAddress(event: any = {}) {

    if (!this.mapInitialized) return;

    const query = event.target.value;

    if (query && query.length >= 3) {

      const config = {
        input: query,
      };

      this.autocompleteService.getPlacePredictions(config, (predictions: any) => {
        this.zone.run(() => {
          if (predictions) this.suggestions = predictions;
        });
      });

    }
  }

  onSuggestionTouched(suggestion: any) {

    if (!this.mapInitialized) return;

    this.suggestions = [];

    this.placesService.getDetails({ placeId: suggestion.place_id }, (details: any) => {

      this.zone.run(() => {

        const coords = {
          latitude: details.geometry.location.lat(),
          longitude: details.geometry.location.lng()
        };

        this.map.panTo({
          lat: coords.latitude,
          lng: coords.longitude
        })

        this.map.googleMap.setZoom(6);

        this.location = coords;
        this.params.latitude = coords.latitude;
        this.params.longitude = coords.longitude;
        this.params.address = details.formatted_address;
        this.params.bounds = null;
        this.zoomMyLocation = false;

        this.updateSearchBarValue(details.formatted_address);

        this.removeActiveInfoWindow();

        this.setMapOnAll(null);

        this.reloadUrl();

        setTimeout(() => this.loadData(), 400);
      });

    });

  }

  getFilteredParams() {
    const params = Object.assign({}, this.params);

    const allowed = [
      'featured',
      'ratingMin',
      'ratingMax',
      'maxDistance',
      'latitude',
      'longitude',
      'cat',
      'address',
    ];

    return Object.keys(params)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {});
  }

  reloadUrl() {
    const urlTree = this.createUrlTree(this.getFilteredParams());
    this.locationService.go(urlTree.toString());
  }

  async loadData() {

    try {

      this.showLoadingView({ showOverlay: false });

      this.places = await this.placeService.load(this.params);

      if (!this.places.length) {
        this.translate.get('EMPTY_PLACES').subscribe(str => this.showToast(str));
        this.showEmptyView();
        this.cupertinoPane.hide();
      } else {
        this.showContentView();

        if (this.platform.is('mobile')) {
          this.cupertinoPane.present({ animate: true });
        }
      }

      this.onPlacesLoaded();

    } catch (err) {
      this.translate.get('ERROR_NETWORK')
        .subscribe(str => this.showToast(str));
      this.showErrorView();

      if (!this.cupertinoPane.isHidden()) {
        this.cupertinoPane.hide();
      }
    }
  }

  onPlacesLoaded() {

    setTimeout(() => {

      this.zone.run(() => {

        const bounds = new google.maps.LatLngBounds();
        const points = [];

        this.placeToInfoWindow = new Map<string, any>();

        for (const place of this.places) {

          const position = new google.maps.LatLng(place.location.latitude, place.location.longitude);

          bounds.extend(position);

          const marker = new google.maps.Marker({
            icon: {
              url: place.icon ? place.icon.url() : './assets/img/pin.png',
              scaledSize: new google.maps.Size(32, 32),
            },
            position: position,
            map: this.map.googleMap,
          });

          marker.addListener('click', () => {
            this.map.panTo(marker.getPosition());
          });

          this.markers.push(marker);

          const factory = this.resolver.resolveComponentFactory(InfoWindowComponent);
          const component = factory.create(this.injector);
          component.instance.place = place;
          component.instance.location = this.location;
          component.instance.unit = this.params.unit;
          component.changeDetectorRef.detectChanges();

          component.instance.onButtonTouched.subscribe((place: Place) => {
            this.zone.run(() => this.onPlaceTouched(place));
          })

          const infoWindow = new this.snazzyInfoWindow({
            marker: marker,
            content: component.location.nativeElement,
            padding: '0',
            wrapperClass: 'info-window-wrapper',
            showCloseButton: false,
            panOnOpen: false,
            closeWhenOthersOpen: true,
            callbacks: {
              afterOpen: () => {
                this.activeInfoWindow = infoWindow;
              },
            }
          });

          this.placeToInfoWindow.set(place.id, infoWindow);

          points.push(position);
        }

        if (this.zoomMyLocation && this.myLocationMarker) {
          bounds.extend(this.myLocationMarker.getPosition());
        }

        if (points.length || this.zoomMyLocation) {

          const padding: google.maps.Padding = {};

          if (this.platform.is('mobile')) {
            padding.bottom = this.cupertinoInitialBreakPoint;
          }

          this.map.fitBounds(bounds, padding);
        }

        if (!points.length && this.zoomMyLocation) {
          this.map.googleMap.setZoom(this.map.getZoom() - 8);
        }

      });

    }, 100);

  }

  onReload() {
    this.setMapOnAll(null);
    this.markers = [];
    this.loadData();
  }

  onPlaceTouched(place: Place) {
    this.navigateToRelative('../' + place.id + '/' + place.slug);
  }

  async onSearchButtonTapped() {

    this.removeActiveInfoWindow();

    const bounds = this.map.getBounds();

    this.params.bounds = [{
      latitude: bounds.getSouthWest().lat(),
      longitude: bounds.getSouthWest().lng(),
    }, {
      latitude: bounds.getNorthEast().lat(),
      longitude: bounds.getNorthEast().lng(),
    }];

    this.zoomMyLocation = false;

    await this.showLoadingView({ showOverlay: false });
    this.onReload();
  }

  onPlaceHover(place: Place) {
    const infoWindow = this.placeToInfoWindow.get(place.id);
    infoWindow.open();
  }

  removeActiveInfoWindow() {
    if (this.activeInfoWindow) {
      this.activeInfoWindow.destroy();
      this.activeInfoWindow = null;
    }
  }

  async showInfoWindow(place: Place, event: Event) {

    event.stopPropagation();

    const currentBreak = this.cupertinoPane.currentBreak();

    if (currentBreak === 'top' || currentBreak === 'middle') {

      const infoWindow = this.placeToInfoWindow.get(place.id);
      infoWindow.open();

      this.cupertinoPane.moveToBreak('bottom');

      setTimeout(() => {

        this.map.panTo({
          lat: place.location.latitude,
          lng: place.location.longitude
        });

        this.map.googleMap.setZoom(14);

      }, 600);
    }
  }

}
