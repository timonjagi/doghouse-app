import { Component, Input, OnInit } from '@angular/core';
import { Place } from 'src/app/services/place-service';

@Component({
  selector: 'app-place-sheet-modal',
  templateUrl: './place-sheet-modal.page.html',
  styleUrls: ['./place-sheet-modal.page.scss'],
})
export class PlaceSheetModalPage implements OnInit {

  @Input() places: Place[];

  constructor() { }

  ngOnInit() {
  }

  onPlaceTouched(place: Place) {
    window.dispatchEvent(new CustomEvent('place:selected', { detail: place }));
  }

}
