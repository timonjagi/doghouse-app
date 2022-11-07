import { NgModule } from '@angular/core';
import { PhotoGalleryGroupDirective } from './photo-gallery-group.directive';
import { PhotoGalleryDirective } from './photo-gallery.directive';

@NgModule({
	declarations: [
    PhotoGalleryGroupDirective,
    PhotoGalleryDirective,
	],
	imports: [],
	exports: [
    PhotoGalleryGroupDirective,
    PhotoGalleryDirective,
	]
})
export class DirectivesModule {}
