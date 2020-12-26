import Denque from 'denque';

export default class DataWindow<Data> {
  private readonly size: number;
  private readonly initial: Data[];
  private curDenque: Denque<Data>;

  constructor(size: number, initial: Data[] = []) {
    this.size = size;
    this.initial = [...initial];
    this.curDenque = new Denque(initial);
  }

  addData(data: Data) {
    this.curDenque.push(data);
    if (this.curDenque.length >= this.size) this.curDenque.shift();
  }

  values(): readonly Data[] {
    return this.curDenque.toArray();
  }

  recent(index: number = 0): Data {
    return this.curDenque.peekAt(this.curDenque.length - index - 1) as Data;
  }

  get(index: number): Data {
    return this.curDenque.peekAt(index) as Data;
  }

  reset() {
    this.curDenque = new Denque(this.initial);
  }

  count(): number {
    return this.curDenque.length;
  }
}
