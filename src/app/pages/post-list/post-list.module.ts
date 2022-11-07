import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PostListPage } from './post-list';
import { SharedModule } from '../../shared.module';
import { SwiperModule } from 'swiper/angular';

@NgModule({
  declarations: [
    PostListPage,
  ],
  imports: [
    SharedModule,
    SwiperModule,
    RouterModule.forChild([
      {
        path: '',
        component: PostListPage
      }
    ])
  ]
})
export class PostListPageModule {}
