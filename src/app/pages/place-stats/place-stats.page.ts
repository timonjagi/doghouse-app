import { Component, OnInit, Input, HostListener } from '@angular/core';
import { Place } from 'src/app/services/place-service';
import { isPlatform, ModalController } from '@ionic/angular';
import { startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, } from 'date-fns';

interface Filter {
  id: string,
  startDate?: Date,
  endDate?: Date
}
@Component({
  selector: 'app-place-stats',
  templateUrl: './place-stats.page.html',
  styleUrls: ['./place-stats.page.scss'],
})
export class PlaceStatsPage implements OnInit {

  @Input() place: Place;

  @HostListener('window:popstate')
  onPopState() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      this.modalCtrl.dismiss();
    }
  }

  public selectedFilter: Filter;

  public statistics: {
    views: number,
    calls: number,
    likes: number,
  };

  public filters: Filter[]

  constructor(private modalCtrl: ModalController, private placeService: Place) {
    this.setupFilters();
    this.statistics = { views: 0, calls: 0, likes: 0 }
  }

  ngOnInit() {
    this.loadStatistics();

    if (isPlatform('android') && isPlatform('mobileweb')) {
      history.pushState({ modal: true }, null);
    }
  }

  setupFilters() {

    const now = new Date

    this.filters = [{
      id: 'today',
      startDate: startOfToday(),
      endDate: endOfToday()
    }, {
      id: 'this_week',
      startDate: startOfWeek(now),
      endDate: endOfWeek(now)
    }, {
      id: 'this_month',
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    }, {
      id: 'all_time'
    }]

    this.selectedFilter = this.filters[this.filters.length - 1];
  }

  onFilterButtonTouched(filter: Filter) {
    this.selectedFilter = filter;

    if (this.selectedFilter.id === 'all_time') {
      this.statistics.likes = this.place.likeCount;
      this.statistics.calls = this.place.callCount;
      this.statistics.views = this.place.viewCount;
    } else {
      this.loadStatistics();
    }
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

  async loadStatistics() {
    try {
      this.statistics = await this.placeService.loadStatistics({
        placeId: this.place.id,
        ...this.selectedFilter
      });
    } catch (error) {
      console.log(error);
    }
  }

}
