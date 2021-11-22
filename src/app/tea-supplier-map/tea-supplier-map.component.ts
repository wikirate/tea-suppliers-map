import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router, RouterModule} from "@angular/router";
// @ts-ignore
import country_codes from '../../assets/country-codes.json';
// @ts-ignore
import wikirate_countries from '../../assets/wikirate-countries.json';
// @ts-ignore
import morissons from '../../assets/Morissons_Suppliers.json';
import embed from "vega-embed";
import {TeaService} from "../services/tea.service";
import {Company} from '../models/company.model';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'tea-supplier-map',
  templateUrl: './tea-supplier-map.component.html',
  styleUrls: ['./tea-supplier-map.component.scss']
})
export class TeaSupplierMapComponent implements OnInit, AfterViewInit, OnDestroy {
  paramsSubs!: Subscription;
  // @ts-ignore
  @ViewChild('map', {static: false}) mapElement: ElementRef;
  suppliers: [] = [];
  pararms!: { id: number };
  suppliers_map: any;
  tea_companies: Company[] = [];
  selected_company = '';

  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private teaService: TeaService,
              private router: Router,
              private renderer: Renderer2) {
    this.tea_companies = this.teaService.getCompanies()
  }

  ngOnInit(): void {
    this.pararms = {
      id: this.route.snapshot.params['id']
    }
  }

  ngAfterViewInit(): void {
    this.paramsSubs = this.route.params.subscribe((p: Params) => {
      this.pararms.id = p['id'];
      let company = this.teaService.getCompany(+this.pararms.id);
      // @ts-ignore
      this.selected_company = company.name;
      this.suppliers = []

      // @ts-ignore
      this.updateMap(company);
    })
  }

  ngOnDestroy(): void {
    this.paramsSubs.unsubscribe();
  }

  navigateToCompany(event: Event) {
    let value = (<HTMLSelectElement>event.target).value;
    if (value) {
      // @ts-ignore
      this.router.navigate(['/tea_suppliers_map/' + value]);
    }
  }

  updateMap(company: Company) {
    let url = "https://wikirate.org/Core+Country+Answers.json?filter%5Bnot_ids%5D=&filter%5Bcompany_name%5D=&filter%5Bcompany_group%5D%5B%5D=Tea%20Suppliers&view=answer_list&limit=0";
    if (+company.id !== 0) {
      url = "https://wikirate.org/Commons+Tea_Supplied_By+RelationshipAnswer/answer_list.json?filter[company_id]="+company.id+"&limit=0";
    }


    if (this.suppliers_map != null) {
      this.renderer.removeChild(this.mapElement.nativeElement, this.suppliers_map)
      this.suppliers_map = null;
    }

    this.http.get<any>(url)
      .subscribe(response => {
        this.suppliers = response;

        if (this.suppliers.length > 0 && +company.id === 0) {
          console.log("Hello World")
          this.suppliers_map = this.renderer.createElement('div');
          this.suppliers_map.id = "supplier-map";
          this.renderer.appendChild(this.mapElement.nativeElement, this.suppliers_map)
          embed("div#supplier-map", {
            "$schema": "https://vega.github.io/schema/vega/v5.json",
            "description": "Number of Tea Suppliers per Country",
            "width": 900,
            "height": 560,
            "padding": {"top": 25, "left": 0, "right": 0, "bottom": 0},
            "autosize": "none",
            "signals": [
              {"name": "type", "value": "equalEarth"},
              {"name": "scale", "value": 200},
              {"name": "rotate0", "value": -15},
              {"name": "rotate1", "value": 0},
              {"name": "rotate2", "value": 0},
              {"name": "center0", "value": 0},
              {"name": "center1", "value": 0},
              {"name": "translate0", "update": "width / 2"},
              {"name": "translate1", "update": "height / 2"},
              {"name": "borderWidth", "value": 2},
              {
                "name": "hover",
                "value": null,
                "on": [
                  {"events": "@circles:mouseover", "update": "datum"},
                  {"events": "@circles:mouseout", "update": "null"}
                ]
              },
              {
                "name": "title",
                "value": "Number of Tea Suppliers per Country",
                "update": "hover ? hover.country + ' (' + hover.companies + ')' : 'Number of Tea Suppliers per Country'"
              },
              {
                "name": "cell_stroke",
                "value": null,
                "on": [
                  {"events": "dblclick", "update": "cell_stroke ? null : 'brown'"},
                  {"events": "mousedown!", "update": "cell_stroke"}
                ]
              }
            ],
            "data": [
              {
                "name": "world",
                "url": "assets/world-110m.json",
                "format": {"type": "topojson", "feature": "countries"},
                "transform": [{"type": "geopath", "projection": "projection"}]
              },
              {
                "name": "suppliers_country",
                "url": "https://wikirate.org/Core+Country+Answer.json?filter[not_ids]=&filter[company_name]=&filter[company_group][]=Supplier%20of%20Apparel%20100&view=answer_list&limit=0",
                "format": {"type": "json", "parse": "auto"}
              },
              {
                "name": "suppliers",
                "url": "https://wikirate.org/Core+Country+Answers.json?filter%5Bnot_ids%5D=&filter%5Bcompany_name%5D=&filter%5Bcompany_group%5D%5B%5D=Tea%20Suppliers&view=answer_list&limit=0"
              },
              {
                "name": "wikirate_countries",
                "values": wikirate_countries
              },
              {
                "name": "country_codes",
                "values": country_codes,
                "format": {"type": "json", "parse": {"country-code": "number"}}
              },
              {
                "name": "suppliers_per_country",
                "source": "suppliers",
                "transform": [
                  {
                    "type": "aggregate",
                    "groupby": ["value"],
                    "fields": ["name"],
                    "ops": ["count"],
                    "as": ["companies"]
                  },
                  {
                    "type": "lookup",
                    "from": "wikirate_countries",
                    "key": "name",
                    "fields": ["value"],
                    "values": ["code"],
                    "as": ["country_code"]
                  },
                  {
                    "type": "lookup",
                    "from": "country_codes",
                    "key": "alpha-2",
                    "fields": ["country_code"],
                    "values": ["country-code"],
                    "as": ["country_number"]
                  },
                  {
                    "type": "lookup",
                    "from": "world",
                    "key": "id",
                    "fields": ["country_number"],
                    "as": ["geo"]
                  },
                  {"type": "filter", "expr": "datum.geo"},
                  {
                    "type": "formula",
                    "as": "centroid",
                    "expr": "geoCentroid('projection', datum.geo)"
                  },
                  {"type": "formula", "as": "color", "expr": "'#ffc870'"},
                  {"type": "formula", "as": "type", "expr": "'Tea Suppliers'"}
                ]
              },
              {
                "name": "tea_companies_per_country",
                "url": "https://wikirate.org/Core+Country+Answer.json?filter%5Bnot_ids%5D=&filter%5Bcompany_name%5D=&filter%5Bcompany_group%5D%5B%5D=Tea%20Companies%20reporting%20Suppliers%20(2021)&limit=0&view=answer_list",
                "transform": [
                  {
                    "type": "aggregate",
                    "groupby": ["value"],
                    "fields": ["name"],
                    "ops": ["count"],
                    "as": ["companies"]
                  },
                  {
                    "type": "lookup",
                    "from": "wikirate_countries",
                    "key": "name",
                    "fields": ["value"],
                    "values": ["code"],
                    "as": ["country_code"]
                  },
                  {
                    "type": "lookup",
                    "from": "country_codes",
                    "key": "alpha-2",
                    "fields": ["country_code"],
                    "values": ["country-code"],
                    "as": ["country_number"]
                  },
                  {
                    "type": "lookup",
                    "from": "world",
                    "key": "id",
                    "fields": ["country_number"],
                    "as": ["geo"]
                  },
                  {"type": "filter", "expr": "datum.geo"},
                  {
                    "type": "formula",
                    "as": "centroid",
                    "expr": "geoCentroid('projection', datum.geo)"
                  },
                  {"type": "formula", "as": "color", "expr": "'#3FA8D4'"},
                  {"type": "formula", "as": "type", "expr": "'Tea Buyers'"}
                ]
              },
              {
                "name": "companies_and_suppliers",
                "source": ["tea_companies_per_country", "suppliers_per_country"]
              },
              {"name": "graticule", "transform": [{"type": "graticule"}]}
            ],
            "projections": [
              {
                "name": "projection",
                "type": {"signal": "type"},
                "scale": {"signal": "scale"},
                "rotate": [
                  {"signal": "rotate0"},
                  {"signal": "rotate1"},
                  {"signal": "rotate2"}
                ],
                "center": [{"signal": "center0"}, {"signal": "center1"}],
                "translate": [{"signal": "translate0"}, {"signal": "translate1"}]
              }
            ],
            "scales": [
              {
                "name": "size",
                "domain": {"data": "suppliers_per_country", "field": "companies"},
                "zero": false,
                "range": [50, 2000]
              },
              {
                "name": "color",
                "type": "linear",
                "nice": true,
                "domain": {"data": "suppliers_per_country", "field": "companies"},
                "range": ["#ffe7c0", "#ffaa23"]
              }
            ],
            "marks": [
              {
                "type": "shape",
                "from": {"data": "graticule"},
                "encode": {
                  "update": {
                    "strokeWidth": {"value": 1},
                    "stroke": {"signal": "'#ddd'"},
                    "fill": {"value": null}
                  }
                },
                "transform": [{"type": "geoshape", "projection": "projection"}]
              },
              {
                "type": "shape",
                "from": {"data": "world"},
                "encode": {
                  "update": {
                    "strokeWidth": {"signal": "+borderWidth"},
                    "fill": {"value": "#152234"},
                    "zindex": {"value": 0}
                  }
                },
                "transform": [{"type": "geoshape", "projection": "projection"}]
              },
              {
                "name": "circles",
                "type": "symbol",
                "from": {"data": "companies_and_suppliers"},
                "encode": {
                  "enter": {
                    "x": {"field": "centroid[0]"},
                    "y": {"field": "centroid[1]"},
                    "size": {"scale": "size", "field": "companies"},
                    "strokeWidth": {"value": 0.7},
                    "tooltip": {
                      "signal": "{'title' : datum.value, 'No. of Entities': datum.companies, 'Type of Entities': datum.type}"
                    }
                  },
                  "update": {"fill": {"field": "color"}, "stroke": {"value": "#152234"}},
                  "hover": {"fill": {"value": "#995e00"}, "stroke": {"value": "#152234"}}
                },
                "transform": [
                  {
                    "type": "force",
                    "static": true,
                    "forces": [
                      {
                        "force": "collide",
                        "radius": {"expr": "1 + sqrt(datum.size) / 2"}
                      },
                      {"force": "x", "x": "datum.centroid[0]"},
                      {"force": "y", "y": "datum.centroid[1]"}
                    ]
                  }
                ]
              }
            ]
          }, {renderer: "svg"});
        } else if (this.suppliers.length > 0) {
          this.suppliers_map = this.renderer.createElement('div');
          this.suppliers_map.id = "supplier-map";
          this.renderer.appendChild(this.mapElement.nativeElement, this.suppliers_map)
          embed("div#supplier-map", {
            "$schema": "https://vega.github.io/schema/vega/v5.json",
            "description": "Number of Tea Suppliers per Country",
            "width": 900,
            "height": 560,
            "padding": {"top": 25, "left": 0, "right": 0, "bottom": 0},
            "autosize": "none",
            "signals": [
              {"name": "type", "value": "equalEarth"},
              {"name": "scale", "value": 200},
              {"name": "rotate0", "value": -15},
              {"name": "rotate1", "value": 0},
              {"name": "rotate2", "value": 0},
              {"name": "center0", "value": 0},
              {"name": "center1", "value": 0},
              {"name": "translate0", "update": "width / 2"},
              {"name": "translate1", "update": "height / 2"},
              {"name": "borderWidth", "value": 2},
              {
                "name": "hover",
                "value": null,
                "on": [
                  {"events": "@circles:mouseover", "update": "datum"},
                  {"events": "@circles:mouseout", "update": "null"}
                ]
              },
              {
                "name": "title",
                "value": "Number of Tea Suppliers per Country",
                "update": "hover ? hover.country + ' (' + hover.companies + ')' : 'Number of Tea Suppliers per Country'"
              },
              {
                "name": "cell_stroke",
                "value": null,
                "on": [
                  {"events": "dblclick", "update": "cell_stroke ? null : 'brown'"},
                  {"events": "mousedown!", "update": "cell_stroke"}
                ]
              }
            ],
            "data": [
              {
                "name": "world",
                "url": "assets/world-110m.json",
                "format": {"type": "topojson", "feature": "countries"},
                "transform": [{"type": "geopath", "projection": "projection"}]
              },
              {
                "name": "suppliers_country",
                "url": "https://wikirate.org/Core+Country+Answer.json?filter[not_ids]=&filter[company_name]=&filter[company_group][]=Tea Suppliers&view=answer_list&limit=0",
                "format": {"type": "json", "parse": "auto"}
              },
              {
                "name": "suppliers",
                "values": this.suppliers,
                "transform": [
                  {
                    "type": "lookup",
                    "from": "suppliers_country",
                    "key": "company",
                    "fields": ["object_company"],
                    "values": ["value"],
                    "as": ["value"]
                  }
                ]
              },
              {
                "name": "wikirate_countries",
                "values": wikirate_countries
              },
              {
                "name": "country_codes",
                "values": country_codes,
                "format": {"type": "json", "parse": {"country-code": "number"}}
              },
              {
                "name": "suppliers_per_country",
                "source": "suppliers",
                "transform": [
                  {
                    "type": "aggregate",
                    "groupby": ["value"],
                    "fields": ["name"],
                    "ops": ["count"],
                    "as": ["companies"]
                  },
                  {
                    "type": "lookup",
                    "from": "wikirate_countries",
                    "key": "name",
                    "fields": ["value"],
                    "values": ["code"],
                    "as": ["country_code"]
                  },
                  {
                    "type": "lookup",
                    "from": "country_codes",
                    "key": "alpha-2",
                    "fields": ["country_code"],
                    "values": ["country-code"],
                    "as": ["country_number"]
                  },
                  {
                    "type": "lookup",
                    "from": "world",
                    "key": "id",
                    "fields": ["country_number"],
                    "as": ["geo"]
                  },
                  {"type": "filter", "expr": "datum.geo"},
                  {
                    "type": "formula",
                    "as": "centroid",
                    "expr": "geoCentroid('projection', datum.geo)"
                  },
                  {
                    "type": "formula",
                    "as": "color",
                    "expr": "'#ffc870'"
                  },
                  {
                    "type": "formula",
                    "as": "type",
                    "expr": "'Tea Suppliers'"
                  }
                ]
              },
              {"name": "graticule", "transform": [{"type": "graticule"}]}
            ],
            "projections": [
              {
                "name": "projection",
                "type": {"signal": "type"},
                "scale": {"signal": "scale"},
                "rotate": [
                  {"signal": "rotate0"},
                  {"signal": "rotate1"},
                  {"signal": "rotate2"}
                ],
                "center": [
                  {"signal": "center0"},
                  {"signal": "center1"}
                ],
                "translate": [
                  {"signal": "translate0"},
                  {"signal": "translate1"}
                ]
              }
            ],
            "scales": [
              {
                "name": "size",
                "domain": {"data": "suppliers_per_country", "field": "companies"},
                "zero": false,
                "range": [50, 2000]
              },
              {
                "name": "color",
                "type": "linear",
                "nice": true,
                "domain": {"data": "suppliers_per_country", "field": "companies"},
                "range": ["#ffe7c0", "#ffaa23"]
              }
            ],
            "marks": [
              {
                "type": "shape",
                "from": {"data": "graticule"},
                "encode": {
                  "update": {
                    "strokeWidth": {"value": 1},
                    "stroke": {"signal": "'#ddd'"},
                    "fill": {"value": null}
                  }
                },
                "transform": [
                  {"type": "geoshape", "projection": "projection"}
                ]
              },
              {
                "type": "shape",
                "from": {"data": "world"},
                "encode": {
                  "update": {
                    "strokeWidth": {"signal": "+borderWidth"},
                    "fill": {"value": "#152234"},
                    "zindex": {"value": 0}
                  }
                },
                "transform": [{"type": "geoshape", "projection": "projection"}]
              },
              {
                "name": "circles",
                "type": "symbol",
                "from": {"data": "suppliers_per_country"},
                "encode": {
                  "enter": {
                    "x": {"field": "centroid[0]"},
                    "y": {"field": "centroid[1]"},
                    "size": {"scale": "size", "field": "companies"},
                    "strokeWidth": {"value": 0.7},
                    "tooltip": {
                      "signal": "{'title' : datum.value, 'No. of Suppliers': datum.companies}"
                    }
                  },
                  "update": {
                    "fill": {"field": "color"},
                    "stroke": {"value": "#152234"}
                  },
                  "hover": {"fill": {"value": "#995e00"}, "stroke": {"value": "#152234"}}
                },
                "transform": [
                  {
                    "type": "force",
                    "static": true,
                    "forces": [
                      {
                        "force": "collide",
                        "radius": {"expr": "1 + sqrt(datum.size) / 2"}
                      },
                      {"force": "x", "x": "datum.centroid[0]"},
                      {"force": "y", "y": "datum.centroid[1]"}
                    ]
                  }
                ]
              }
            ]
          }, {renderer: "svg"});
        }

      });

  }
}

