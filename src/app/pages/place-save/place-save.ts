import { Component, Injector, ElementRef, ViewChild, NgZone } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { Place } from '../../services/place-service';
import { MapStyle } from '../../services/map-style';
import { ParseFile } from '../../services/parse-file-service';
import { Category } from '../../services/categories';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { IonSearchbar } from '@ionic/angular';
import { User } from 'src/app/services/user-service';
import { Package } from 'src/app/services/package';
import { AppConfigService } from 'src/app/services/app-config.service';
import { UserPackage } from 'src/app/services/user-package';
import { PayModalPage } from '../pay-modal/pay-modal.page';
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger
} from '@angular/animations';
import { GoogleMap, MapGeocoder } from '@angular/google-maps';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-place-save',
  templateUrl: './place-save.html',
  styleUrls: ['./place-save.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: `translate3d(0,10px,0)` }), { optional: true }),
        query(':enter', stagger('100ms', [animate('300ms', style({ opacity: 1, transform: `translate3d(0,0,0)` }))]), { optional: true })
      ])
    ])
  ]
})
export class PlaceSavePage extends BasePage {

  @ViewChild('map', { static: false }) mapElement: ElementRef;
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  @ViewChild(IonSearchbar, { static: false }) searchBar: IonSearchbar;

  public autocompleteService: google.maps.places.AutocompleteService;
  public placesService: google.maps.places.PlacesService;
  public mapInitialized: boolean = false;

  public suggestions: any = [];

  public form: FormGroup;
  public categories: Category[] = [];
  public slidesConfig = {};
  public mainUpload: ParseFile;
  public uploads: Array<{ file: ParseFile }>;

  public isSaving: boolean;

  public packages: Package[] = [];
  public userPackages: UserPackage[] = [];

  public isPaidListingEnabled: boolean;

  public mapOptions: google.maps.MapOptions = {};

  public onMapCenterChange$: Subject<any>;

  public isEditMode: boolean;

  public customPopoverOptions: any = {
    align: 'start',
    size: 'cover',
    side: 'bottom',
  };

  constructor(injector: Injector,
    private zone: NgZone,
    private geolocationService: GeolocationService,
    private packageService: Package,
    private userPackageService: UserPackage,
    private appConfigService: AppConfigService,
    private placeService: Place,
    private geocoder: MapGeocoder,
    private categoryService: Category) {
    super(injector);
  }

  enableMenuSwipe() {
    return true;
  }

  async ionViewDidEnter() {

    const title = await this.getTrans('ADD_PLACE');
    this.setPageTitle(title);

    this.setMetaTags({
      title: title
    });

    this.showLoadingView({ showOverlay: false });
    this.loadData();
  }

  ngOnInit() {
    const maxUploads = 9;
    this.setupImages(maxUploads);
    this.setupObservable();
    this.setupForm();
  }

  async loadData() {

    try {

      const id = this.getParams().id;

      if (id) {

        const place = await this.placeService.loadOne(id);

        const user = User.getCurrent();

        if (user.id !== place.user?.id) {
          return this.setRoot('/1/profile');
        }

        this.isEditMode = true;

        this.form.controls.name.setValue(place.title);
        this.form.controls.categories
          .setValue(place.categories.map(category => category.id));
        this.form.controls.description.setValue(place.description);
        this.form.controls.address.setValue(place.address);
        this.form.controls.phone.setValue(place.phone);
        this.form.controls.priceRange.setValue(place.priceRange);
        this.form.controls.email.setValue(place.email);
        this.form.controls.whatsapp.setValue(place.whatsapp);
        this.form.controls.website.setValue(place.website || 'https://');
        this.form.controls.facebook.setValue(place.facebook || 'https://');
        this.form.controls.instagram.setValue(place.instagram || 'https://');
        this.form.controls.youtube.setValue(place.youtube || 'https://');

        this.mainUpload = place.image;

        const images = place.images || [];

        if (images.length > this.uploads.length) {
          const maxUploads = images.length;
          this.setupImages(maxUploads);
        }

        for (let i = 0; i < images.length; i++) {
          this.uploads[i].file = images[i];
        }

        if (place.location) {
          this.mapOptions.center = {
            lat: place.location.latitude,
            lng: place.location.longitude,
          };
          this.mapOptions.zoom = 15;
        }
      }

      if (!this.isEditMode) {

        const config = await this.appConfigService.load();

        this.isPaidListingEnabled = config?.places?.enablePaidListings;

        if (this.isPaidListingEnabled) {
          this.packages = await this.packageService.load({
            type: 'paid_listing'
          });
          this.userPackages = await this.userPackageService.load({
            status: 'paid',
            type: 'paid_listing',
            isLimitReached: false
          });

          this.form.controls.package.setValidators(Validators.required);
          this.form.controls.package.updateValueAndValidity();
        }

      }

      this.categories = await this.categoryService.load();
      this.showContentView();

      if (typeof google === 'undefined') {
        this.loadGoogleMaps();
      } else {
        this.initMap();
      }

    } catch {
      this.showErrorView();
    }

  }

  setupImages(count: number) {
    // Generate 9 upload boxes
    this.uploads = Array
      .from({ length: count })
      .map(() => { return { file: null } });
  }

  setupForm() {
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      categories: new FormControl(null),
      package: new FormControl(null),
      description: new FormControl(''),
      address: new FormControl(''),
      phone: new FormControl(''),
      priceRange: new FormControl(''),
      email: new FormControl(''),
      website: new FormControl('https://'),
      facebook: new FormControl('https://'),
      instagram: new FormControl('https://'),
      youtube: new FormControl('https://'),
      whatsapp: new FormControl(''),
    });
  }

  onMainFileUploaded(file: ParseFile) {
    this.mainUpload = file;
  }

  onFileUploaded(file: ParseFile, upload: any) {
    upload.file = file;
  }

  loadGoogleMaps() {

    window['mapInit'] = () => {
      this.zone.run(() => this.initMap());
    }

    const apiKey = environment.googleMapsApiKey;

    const script = document.createElement('script');
    script.id = 'googleMaps';
    script.src = `https://maps.google.com/maps/api/js?key=${apiKey}&callback=mapInit&libraries=places`;
    document.body.appendChild(script);

  }

  setupObservable() {

    this.onMapCenterChange$ = new Subject<google.maps.LatLng>();

    // Subscribe to the center_change event with a 500ms delay
    // to minimize multiple requests at the same time.

    this.onMapCenterChange$.pipe(debounceTime(500))
      .subscribe((center: google.maps.LatLng) => {

        const request: google.maps.GeocoderRequest = {
          location: center
        };

        this.geocoder.geocode(request).subscribe(({ results, status }) => {
          if (status === google.maps.GeocoderStatus.OK) {
            const target = results[0];
            this.searchBar.value = target.formatted_address;
            this.form.controls.address.setValue(target.formatted_address);
          }
        });

      });
  }

  onCenterChanged() {
    this.onMapCenterChange$.next(this.map.getCenter());
  }

  async initMap() {

    this.mapInitialized = true;

    const styles: any = this.preference.isDarkModeEnabled
      ? MapStyle.dark()
      : MapStyle.light();

    this.mapOptions = {
      center: { lat: 0, lng: 0 },
      styles: styles,
      zoom: 4,
      minZoom: 2,
      maxZoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      ...this.mapOptions,
    };

    setTimeout(async () => {

      const icon = document.createElement('ion-icon')
      icon.name = 'locate-outline';

      const component = document.createElement('ion-button');
      component.size = 'small';
      component.color = 'secondary';
      component.style.width = '40px';
      component.style.height = '40px';
      component.style.borderRadius = '50%';
      component.style.marginInlineEnd = '10px';
      component.appendChild(icon);
      component.onclick = () => this.loadCurrentLocation();
      this.map.googleMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(component);

      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.placesService = new google.maps.places.PlacesService(this.map.googleMap);

      if (!this.isEditMode) {
        this.loadCurrentLocation();
      }

    });
  }

  async loadCurrentLocation() {
    try {

      const coords = await this.geolocationService.getCurrentPosition();

      if (!coords) {
        return this.translate.get('ERROR_LOCATION_UNAVAILABLE')
          .subscribe(str => this.showToast(str));
      }

      this.map.panTo({
        lat: coords.latitude,
        lng: coords.longitude
      });
      this.map.googleMap.setZoom(15);

    } catch (err) {
      console.log(err);
    }
  }

  onSuggestionTouched(suggestion: any) {

    if (!this.mapInitialized) return;

    this.suggestions = [];

    this.placesService.getDetails({ placeId: suggestion.place_id }, (details: any) => {

      this.zone.run(() => {

        const location = details.geometry.location;

        this.searchBar.value = details.formatted_address;
        this.form.controls.address.setValue(details.formatted_address);

        this.map.panTo(location);
        this.map.googleMap.setZoom(15);
      });

    });

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

  preparePlaceData(): Place {

    let place: any = {};

    const formData = Object.assign({}, this.form.value);

    place.packageId = formData.package;
    place.title = formData.name;
    place.categories = formData.categories;
    place.description = formData.description;
    place.address = formData.address;
    place.website = formData.website;
    place.phone = formData.phone;

    place.email = formData.email;
    place.priceRange = formData.priceRange;

    place.website = '';
    place.facebook = '';
    place.instagram = '';
    place.youtube = '';
    place.whatsapp = '';

    if (formData.website !== 'https://' && formData.website !== '') {
      place.website = formData.website;
    }

    if (formData.facebook !== 'https://' && formData.facebook !== '') {
      place.facebook = formData.facebook;
    }

    if (formData.instagram !== 'https://' && formData.instagram !== '') {
      place.instagram = formData.instagram;
    }

    if (formData.youtube !== 'https://' && formData.youtube !== '') {
      place.youtube = formData.youtube;
    }
   
    place.whatsapp = formData.whatsapp;

    place.image = this.mainUpload;

    place.images = this.uploads
      .filter(item => item.file)
      .map(item => item.file);

    const center = this.map.getCenter();

    const position = {
      lat: center.lat(),
      lng: center.lng(),
    };

    place.location = position;

    return place;
  }

  async presentPayModalPage(place: Place, userPackage: UserPackage) {
    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: PayModalPage,
      componentProps: { place, userPackage },
      cssClass: 'pay-modal'
    });

    await modal.present();

    await this.dismissLoadingView();

    return await modal.onDidDismiss();
  }

  async onSubmit() {

    if (this.form.invalid) {
      const trans = await this.getTrans('INVALID_FORM');
      return this.showToast(trans);
    }

    try {

      this.isSaving = true;

      const payload = this.preparePlaceData();

      let userPackage = null;
      let place = null;

      if (!this.isEditMode) {
        const {
          place: place1,
          userPackage: userPackage1,
        } = await this.placeService.createInCloud(payload);

        place = place1;
        userPackage = userPackage1;
      } else {
        const id = this.getParams().id;
        const place1 = await this.placeService.updateInCloud(id, payload);
        place = place1;
      }

      this.form.reset();

      this.isSaving = false;

      const trans = await this.getTrans(['GOOD_JOB', 'PLACE_ADDED', 'OK'])

      const sweetAlertOptions: SweetAlertOptions = {
        title: trans.GOOD_JOB,
        text: trans.PLACE_ADDED,
        confirmButtonText: trans.OK,
        icon: 'success',
        heightAuto: false,
        showClass: {
          popup: 'animated fade-in'
        },
        hideClass: {
          popup: 'animated fade-out'
        },
      };

      if (!this.isEditMode && this.isPaidListingEnabled && userPackage.status === 'unpaid') {
        const { data } = await this.presentPayModalPage(place, userPackage);

        if (data) {
          await Swal.fire(sweetAlertOptions);
        }

        this.setRoot(this.preference.currentTab);

      } else {
        await Swal.fire(sweetAlertOptions);

        this.setRoot(this.preference.currentTab);
      }

    } catch (err) {
      this.isSaving = false;

      if (err.code === 5000) {
        this.translate.get('PACKAGE_CANNOT_PURCHASE_MULTIPLE_TIMES')
          .subscribe(str => this.showToast(str));
      } else if (err.code === 5001) {
        this.translate.get('PACKAGE_PURCHASE_LIMIT_REACHED')
          .subscribe(str => this.showToast(str));
      } else {
        this.translate.get('ERROR_NETWORK')
          .subscribe(str => this.showToast(str));
      }

    }

  }

  onSearchCleared() {
    this.suggestions = [];
  }

}
