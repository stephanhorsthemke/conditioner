from condition_navigator.graph import load_graph
from condition_navigator.models import Condition, ConditionGraph


def make_graph() -> ConditionGraph:
    return ConditionGraph(conditions=[
        Condition(id="ibs", name="IBS", parents=[]),
        Condition(id="sibo", name="SIBO", parents=["ibs"]),
        Condition(id="snas", name="SNAS", parents=["ibs"]),
        Condition(id="multi", name="Multi-parent", parents=["ibs", "sibo"]),
    ])


def test_by_id():
    graph = make_graph()
    assert graph.by_id("sibo").name == "SIBO"
    assert graph.by_id("nonexistent") is None


def test_roots():
    graph = make_graph()
    roots = graph.roots()
    assert len(roots) == 1
    assert roots[0].id == "ibs"


def test_children_of():
    graph = make_graph()
    children = graph.children_of("ibs")
    ids = {c.id for c in children}
    assert ids == {"sibo", "snas", "multi"}


def test_multiple_parents():
    graph = make_graph()
    multi = graph.by_id("multi")
    assert "ibs" in multi.parents
    assert "sibo" in multi.parents


def test_load_graph_from_yaml_legacy(tmp_path):
    yaml_content = """
groups:
  - id: grp1
    label: Group One
    conditions:
      - id: cond1
        label: Condition One
      - id: cond2
        label: Condition Two
        aliases: [Alias A]
        subtypes:
          - id: sub1
            label: Subtype One
"""
    p = tmp_path / "conditions.yaml"
    p.write_text(yaml_content)
    graph = load_graph(p)

    assert graph.by_id("cond1").name == "Condition One"
    assert graph.by_id("cond1").group_id == "grp1"
    assert graph.by_id("cond1").parents == []

    assert graph.by_id("cond2").aliases == ["Alias A"]

    assert graph.by_id("sub1").name == "Subtype One"
    assert graph.by_id("sub1").group_id == "grp1"
    assert graph.by_id("sub1").parents == ["cond2"]


def test_load_graph_from_yaml_flat(tmp_path):
    yaml_content = """
groups:
  grp1:
    label: Group One

conditions:
  - id: cond1
    label: Condition One
    group: grp1
    diagnosis_type: aetiological
  - id: cond2
    label: Condition Two
    aliases: [Alias A]
    subtypes:
      - id: sub1
        label: Subtype One
  - id: ungrouped
    label: No Group
"""
    p = tmp_path / "conditions.yaml"
    p.write_text(yaml_content)
    graph = load_graph(p)

    c1 = graph.by_id("cond1")
    assert c1.name == "Condition One"
    assert c1.group_id == "grp1"
    assert c1.group_label == "Group One"
    assert c1.diagnosis_type == "aetiological"
    assert c1.parents == []

    assert graph.by_id("cond2").aliases == ["Alias A"]

    sub = graph.by_id("sub1")
    assert sub.name == "Subtype One"
    assert sub.group_id == ""  # inherits from parent cond2, which has no group
    assert sub.parents == ["cond2"]

    ug = graph.by_id("ungrouped")
    assert ug.group_id == ""
    assert ug.group_label == ""
