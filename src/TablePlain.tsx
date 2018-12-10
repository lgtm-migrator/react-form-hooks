import * as React from "react";
import { TableProps, IColDef } from ".";
import { some, debounce } from "lodash";

interface IState {
  filter: any;
  showSubComponent: object;
}

export class TablePlain extends React.Component<TableProps, IState> {
  state = {
    filter: {},
    showSubComponent: {}
  };

  get rootElement() {
    return this.props.rootElement || "table";
  }
  get rowElement() {
    return this.props.rowElement || "tr";
  }
  get cellElement() {
    return this.props.cellElement || "td";
  }
  get headerCellElement() {
    return this.props.headerCellElement || "th";
  }
  get headerElement() {
    return this.props.headerElement || "thead";
  }
  get bodyElement() {
    return this.props.bodyElement || "tbody";
  }
  get footerElement() {
    return this.props.footerElement || "tfoot";
  }

  get hasFooter() {
    return some(this.props.colDef, def => def.footer != null);
  }

  get isFilterable() {
    return some(this.props.colDef, def => def.filterable === true);
  }

  componentWillMount() {
    for (const plugin of this.props.plugins || []) {
      if (plugin != null) {
        plugin.init(this.props.colDef!);
      }
    }
  }

  render() {
    const { data } = this.props;
    const colDef = this.props.colDef || this.generateColDef(data);

    if (data != null) {
      const Root: any = this.rootElement;
      return (
        <Root>
          {this.renderHeader(colDef)}
          {this.renderData(colDef, data)}
          {this.hasFooter && this.renderFooter(colDef, data)}
        </Root>
      );
    }
    return null;
  }

  renderData(colDef: IColDef[], data: any[]) {
    const Body: any = this.bodyElement;
    return (
      <Body>
        {data && data.map((d, idx) => this.renderRow(colDef, d, idx))}
      </Body>
    );
  }

  renderRow(colDef: IColDef[], data: any, key: number) {
    const Row: any = this.rowElement;
    const Cell: any = this.cellElement;
    const renderIndicator =
      this.props.renderExpansionIndicator || this.renderExpansionIndicator;
    const result = [
      <Row
        key={key}
        style={{
          background: key % 2 ? "#ebebeb" : "white",
          cursor: this.props.onRowClick ? "pointer" : "default"
        }}
        onClick={() => this.props.onRowClick && this.props.onRowClick(data)}
      >
        {this.props.subComponent &&
          this.renderCell(
            {
              header: "",
              prop: "",
              props: () => ({
                onClick: (e: React.MouseEvent) =>
                  this.handleExpansionClick(e, key)
              }),
              render: () =>
                renderIndicator(this.state.showSubComponent[key] === true)
            },
            data,
            -1,
            { width: "1%", style: { paddingRight: 0 } }
          )}
        {colDef.map((def, idx) => this.renderCell(def, data, idx))}
      </Row>
    ];

    if (this.props.subComponent && this.state.showSubComponent[key]) {
      result.push(
        <Row key={-1}>
          <Cell colSpan={colDef.length + 1}>
            {this.props.subComponent(data)}
          </Cell>
        </Row>
      );
    }

    return result;
  }

  renderCell(colDef: IColDef, data: any, idx: number, props?: object) {
    const Cell: any = this.cellElement;
    const ps =
      colDef.props != null ? { ...props, ...colDef.props(data) } : props;
    if (colDef.render != null) {
      return (
        <Cell key={idx} {...ps}>
          {colDef.render(data)}
        </Cell>
      );
    }
    const val =
      colDef.accessor != null ? colDef.accessor(data) : data[colDef.prop];
    return (
      <Cell key={idx} {...ps}>
        {val}
      </Cell>
    );
  }

  renderHeader(colDef: IColDef[]) {
    const Header: any = this.headerElement;
    const Row: any = this.rowElement;
    const Cell: any = this.cellElement;

    const render =
      this.props.renderHeaderCell != null
        ? this.props.renderHeaderCell.bind(this)
        : this.renderHeaderCell.bind(this);

    return (
      <Header>
        <Row>
          {this.props.subComponent &&
            render({ prop: "", header: "" }, -1, {
              width: "1%",
              style: { paddingRight: 0 }
            })}
          {colDef.map(render)}
        </Row>
        {this.isFilterable && (
          <Row>
            {colDef.map((def, idx) => (
              <Cell>
                {def.filterable
                  ? this.props.renderFilter != null
                    ? this.props.renderFilter(def, idx)
                    : this.renderFilter(def, idx)
                  : null}
              </Cell>
            ))}
          </Row>
        )}
      </Header>
    );
  }

  renderHeaderCell(colDef: IColDef, idx: number, props?: object) {
    const HeaderCell: any = this.headerCellElement;
    return (
      <HeaderCell
        key={idx}
        {...colDef.headerProps}
        onClick={() => colDef.sortable && this.handleChangeSort(colDef)}
        {...props}
      >
        {colDef.header}
        {this.props.orderedBy === colDef &&
          this.props.renderSortLabel &&
          this.props.renderSortLabel(colDef, this.props.desc)}
      </HeaderCell>
    );
  }

  renderFilter(colDef: IColDef, idx: number) {
    return (
      <input
        type="text"
        name={colDef.prop}
        value={this.state.filter[colDef.prop] || ""}
        onChange={e => this.handleFilterChange(colDef, e.target.value)}
      />
    );
  }

  renderFooter(colDef: IColDef[], data: any[]) {
    const Footer: any = this.footerElement;
    const Row: any = this.rowElement;
    return (
      <Footer>
        <Row>
          {colDef.map((def, idx) =>
            this.props.renderFooterCell != null
              ? this.props.renderFooterCell(def, data, idx)
              : this.renderFooterCell(def, data, idx)
          )}
        </Row>
      </Footer>
    );
  }

  renderFooterCell(colDef: IColDef, data: any[], idx: number) {
    const FooterCell: any = this.cellElement;
    return (
      <FooterCell key={idx} {...colDef.footerProps}>
        {colDef.footer != null
          ? typeof colDef.footer === "string"
            ? colDef.footer
            : colDef.footer!(colDef, data)
          : null}
      </FooterCell>
    );
  }

  renderExpansionIndicator(expanded: boolean) {
    const rot = expanded ? -90 : 90;
    return (
      <div
        className="expander"
        style={{
          transform: `rotate(${rot}deg)`,
          display: "flex",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        &gt;
      </div>
    );
  }

  generateColDef(data: any[]): IColDef[] {
    return [];
  }

  handleChangeSort = (colDef: IColDef) => {
    if (this.props.onChangeOrderBy) {
      this.props.onChangeOrderBy(colDef);
    }
  };

  handleFilterChange = (colDef: IColDef, value: any) => {
    const name = colDef.prop;
    this.setState(
      p => ({
        filter: {
          ...p.filter,
          [name]: value
        }
      }),
      debounce(() => {
        if (this.props.onChangeFilter) {
          this.props.onChangeFilter(colDef, value);
        }
      }, 500)
    );
  };

  handleExpansionClick = (e: React.MouseEvent, key: number) => {
    e.stopPropagation();
    this.toggleSubmenu(key);
  };

  private toggleSubmenu = (key: number) => {
    this.setState(prev => ({
      showSubComponent: {
        ...prev.showSubComponent,
        [key]: prev.showSubComponent[key] ? false : true
      }
    }));
  };
}