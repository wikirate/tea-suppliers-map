import { Injectable } from "@angular/core";
// @ts-ignore
import companies from '../../assets/tea_companies.json';
import {Company} from "../models/company.model";

@Injectable()
export class TeaService {
  private companies: Company[] = companies;

  getCompany(id: number) {
    const company = this.companies.find(
      (c) => {
        return c.id === id;
      }
    );
    return company;
  }

  getCompanies() {
    return this.companies.slice().sort((c1, c2) => this.compare(c1, c2));
  }

  private compare(c1: Company, c2: Company) {
    if (c1.name == 'All') {
      return -1;
    } else if (c2.name == 'All') {
      return 1;
    } else {
      return c1.name.localeCompare(c2.name)
    }
  }
}
