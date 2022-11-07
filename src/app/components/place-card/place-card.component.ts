import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Place } from 'src/app/services/place-service';

@Component({
  selector: 'app-place-card',
  templateUrl: './place-card.component.html',
  styleUrls: ['./place-card.component.scss'],
})
export class PlaceCardComponent implements OnInit {

  @Input() place: Place;
  @Input() extraParams: any = {};
  @Input() showStatus: boolean;
  @Input() showPromoteButton: boolean;
  @Input() showStatsButton: boolean;
  @Input() showEditButton: boolean;
  @Input() showDeleteButton: boolean;

  @Output() onPromoteButtonTouched: EventEmitter<Place> = new EventEmitter<Place>();
  @Output() onEditEvent: EventEmitter<Place> = new EventEmitter<Place>();
  @Output() onStatsEvent: EventEmitter<Place> = new EventEmitter<Place>();
  @Output() onDeleteEvent: EventEmitter<Place> = new EventEmitter<Place>();

  constructor() { }

  ngOnInit() {}

  onPromoteButtonTouchedFn() {
    this.onPromoteButtonTouched.emit(this.place);
  }

  onEditPlaceTouched() {
    this.onEditEvent.emit(this.place);
  }

  onStatsButtonTouched() {
    this.onStatsEvent.emit(this.place);
  }

  onDeletePlaceTouched() {
    this.onDeleteEvent.emit(this.place);
  }

  getStatusColor(status: string) {
    if (status === 'Pending' || status === 'Pending Approval') {
      return 'warning';
    } else if (status === 'Approved') {
      return 'success';
    } else if (status === 'Rejected') {
      return 'danger';
    } else if (status === 'Expired') {
      return 'medium';
    }
  }

}
