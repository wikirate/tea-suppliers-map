import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TeaSupplierMapComponent } from './tea-supplier-map/tea-supplier-map.component';
import {TeaService} from "./services/tea.service";
import { FormsModule } from '@angular/forms';
import {HttpClientModule} from "@angular/common/http";

@NgModule({
  declarations: [
    AppComponent,
    TeaSupplierMapComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [TeaService],
  bootstrap: [AppComponent]
})
export class AppModule { }
