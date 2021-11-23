import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TeaSupplierMapComponent} from "./tea-supplier-map/tea-supplier-map.component";
import {HashLocationStrategy, LocationStrategy} from "@angular/common";

const routes: Routes = [
  {path: '', redirectTo: '0', pathMatch: 'full'},
  {
    path: ':id', component: TeaSupplierMapComponent
  },
  { path: '**', redirectTo: '/0', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [{provide:LocationStrategy, useClass: HashLocationStrategy}],
  exports: [RouterModule]
})
export class AppRoutingModule { }
